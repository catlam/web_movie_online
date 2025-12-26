// elastic.js
// Client & helpers cho Elasticsearch dùng trong Node.js backend
// npm i @elastic/elasticsearch

import { Client, errors as EsErrors } from '@elastic/elasticsearch';

// =====================
// Cấu hình qua ENV
// =====================
const ES_NODE = process.env.ES_NODE || 'http://localhost:9200';
const ES_USERNAME = process.env.ES_USERNAME || ''; 
const ES_PASSWORD = process.env.ES_PASSWORD || '';
const ES_ENABLED = (process.env.ES_ENABLED ?? 'true').toLowerCase() !== 'false'; 


// Tên index
export const ES_MOVIE_INDEX = process.env.ES_MOVIE_INDEX || 'movies';
export const ES_SERIES_INDEX = process.env.ES_SERIES_INDEX || 'series';


// =====================
// Khởi tạo client
// =====================
export const es = ES_ENABLED
    ? new Client({
        node: ES_NODE,
        ...(ES_USERNAME && ES_PASSWORD
            ? { auth: { username: ES_USERNAME, password: ES_PASSWORD } }
            : {}),
    })
    : null;

// =====================
// Log tiện ích
// =====================
const log = (...args) => console.log('[ES]', ...args);
const warn = (...args) => console.warn('[ES]', ...args);
const err = (...args) => console.error('[ES]', ...args);

// =====================
// Ping (kiểm tra kết nối)
// =====================
export async function esPing() {
    if (!ES_ENABLED || !es) return false;
    try {
        await es.ping();
        return true;
    } catch (e) {
        warn('PING fail:', e?.message || e);
        return false;
    }
}

// =====================
// Tạo index + mapping
// =====================
export async function ensureIndex() {
    if (!ES_ENABLED || !es) return false;
    try {
        const exists = await es.indices.exists({ index: ES_MOVIE_INDEX });
        if (exists) return true;

        await es.indices.create({
            index: ES_MOVIE_INDEX,
            settings: {
                analysis: {
                    normalizer: {
                        vi_fold_norm: {
                            type: 'custom',
                            char_filter: [],
                            filter: ['lowercase', 'asciifolding'],
                        },
                    },
                    analyzer: {
                        vi_ngram: {
                            type: 'custom',
                            tokenizer: 'ngram',
                            filter: ['lowercase'],
                        },
                    },
                    tokenizer: {
                        ngram: {
                            type: 'ngram',
                            min_gram: 2,
                            max_gram: 20,
                            token_chars: ['letter', 'digit'],
                        },
                    },
                },
            },
            mappings: {
                properties: {
                    name: {
                        type: 'text',
                        analyzer: 'vi_ngram',
                        search_analyzer: 'standard',
                        fields: {
                            keyword: { type: 'keyword', ignore_above: 256 },
                            raw: { type: 'keyword', normalizer: 'vi_fold_norm' },
                        },
                    },
                    desc: { type: 'text', analyzer: 'standard' },
                    category: {
                        type: 'keyword',
                        fields: {
                            raw: { type: 'keyword', normalizer: 'vi_fold_norm' }
                        }
                    },
                    language: {
                        type: 'keyword',
                        fields: {
                            raw: { type: 'keyword', normalizer: 'vi_fold_norm' }
                        }
                    },
                    year: { type: 'integer' },
                    rate: { type: 'float' },
                    titleImage: { type: 'keyword', index: false },
                    image: { type: 'keyword', index: false },
                    isPremium: { type: 'boolean' },
                    createdAt: { type: 'date' },
                    updatedAt: { type: 'date' },
                    casts: {
                        properties: {
                            name: {
                                type: 'text',
                                analyzer: 'vi_ngram',
                                search_analyzer: 'standard',
                                fields: {
                                    keyword: { type: 'keyword', ignore_above: 256 },
                                    raw: { type: 'keyword', normalizer: 'vi_fold_norm' },
                                },
                            },
                            image: { type: 'keyword', index: false },
                        },
                    },
                },
            },
        });

        log(`Index "${ES_MOVIE_INDEX}" created`);
        return true;
    } catch (e) {
        // ignore “resource_already_exists_exception”
        if (e?.meta?.body?.error?.type === 'resource_already_exists_exception') {
            return true;
        }
        err('ensureIndex error:', e?.message || e);
        return false;
    }
}

// =====================
// Nâng cấp mapping hiện có (chỉ thêm keyword subfields)
// =====================
export async function ensureKeywordSubfields() {
    if (!ES_ENABLED || !es) return false;
    try {
        const mapping = await es.indices.getMapping({ index: ES_MOVIE_INDEX });
        const props = mapping?.[ES_MOVIE_INDEX]?.mappings?.properties || {};

        const hasName = !!props?.name;
        const hasNameKeyword = props?.name?.fields?.keyword?.type === 'keyword';
        const hasCastsNameKeyword =
            props?.casts?.properties?.name?.fields?.keyword?.type === 'keyword';

        if (hasNameKeyword && hasCastsNameKeyword) {
            // log('Mapping already has name.keyword & casts.name.keyword');
            return true;
        }

        const nameAnalyzer = props?.name?.analyzer || 'vi_ngram';
        const nameSearchAnalyzer = props?.name?.search_analyzer || 'standard';
        const castsNameAnalyzer =
            props?.casts?.properties?.name?.analyzer || 'vi_ngram';
        const castsNameSearchAnalyzer =
            props?.casts?.properties?.name?.search_analyzer || 'standard';

        const body = { properties: {} };

        if (hasName && !hasNameKeyword) {
            body.properties.name = {
                type: 'text',
                analyzer: nameAnalyzer,
                search_analyzer: nameSearchAnalyzer,
                fields: {
                    ...(props?.name?.fields || {}),
                    keyword: { type: 'keyword', ignore_above: 256 },
                },
            };
        }

        if (!hasCastsNameKeyword) {
            body.properties.casts = {
                properties: {
                    name: {
                        type: 'text',
                        analyzer: castsNameAnalyzer,
                        search_analyzer: castsNameSearchAnalyzer,
                        fields: {
                            ...(props?.casts?.properties?.name?.fields || {}),
                            keyword: { type: 'keyword', ignore_above: 256 },
                        },
                    },
                },
            };
        }

        if (!Object.keys(body.properties).length) {
            log('Nothing to update in mapping');
            return true;
        }

        await es.indices.putMapping({
            index: ES_MOVIE_INDEX,
            body,
        });

        log('Mapping updated: added missing *.keyword subfields');
        return true;
    } catch (e) {
        warn('ensureKeywordSubfields error:', e?.message || e);
        return false;
    }
}

// =====================
// Upsert 1 movie
// =====================
// mongoId: _id của movie (string)
export async function upsertMovie(mongoId, movie) {
    if (!ES_ENABLED || !es || !mongoId) return false;
    try {
        await es.index({
            index: ES_MOVIE_INDEX,
            id: mongoId,
            document: {
                name: movie?.name,
                desc: movie?.desc,
                category: movie?.category,
                language: movie?.language,
                year: Number(movie?.year) || null,
                rate: Number(movie?.rate) || 0,
                titleImage: movie?.titleImage || null,
                image: movie?.image || null,
                isPremium: !!movie?.isPremium,
                casts: Array.isArray(movie?.casts)
                    ? movie.casts.map((c) => ({
                        name: c?.name,
                        image: c?.image || null,
                    }))
                    : [],
                createdAt: movie?.createdAt ? new Date(movie.createdAt) : undefined,
                updatedAt: new Date(),
            },
            refresh: 'true', // để search thấy ngay; có thể bỏ để tối ưu hiệu năng
        });
        return true;
    } catch (e) {
        err('upsertMovie error:', e?.message || e);
        return false;
    }
}

// =====================
// Bulk upsert nhiều movies
// =====================
// docs: [{ _id: '...', name, desc, ...}, ...]
export async function bulkUpsertMovies(docs = []) {
    if (!ES_ENABLED || !es || !Array.isArray(docs) || !docs.length)
        return { ok: false };
    try {
        const body = [];
        for (const m of docs) {
            if (!m?._id) continue;
            body.push({ index: { _index: ES_MOVIE_INDEX, _id: String(m._id) } });
            body.push({
                name: m.name,
                desc: m.desc,
                category: m.category,
                language: m.language,
                year: Number(m.year) || null,
                rate: Number(m.rate) || 0,
                titleImage: m.titleImage || null,
                image: m.image || null,
                isPremium: !!m.isPremium,
                casts: Array.isArray(m.casts)
                    ? m.casts.map((c) => ({
                        name: c?.name,
                        image: c?.image || null,
                    }))
                    : [],
                createdAt: m.createdAt ? new Date(m.createdAt) : undefined,
                updatedAt: new Date(),
            });
        }

        const resp = await es.bulk({ refresh: 'true', operations: body });
        if (resp.errors) {
            const items = resp.items?.filter((it) => it.index?.error);
            warn('bulkUpsertMovies: some errors', items?.slice(0, 3));
        }
        return { ok: !resp.errors };
    } catch (e) {
        err('bulkUpsertMovies error:', e?.message || e);
        return { ok: false, error: e?.message || String(e) };
    }
}

// =====================
// Xoá 1 movie
// =====================
export async function deleteMovie(mongoId) {
    if (!ES_ENABLED || !es || !mongoId) return false;
    try {
        await es.delete({
            index: ES_MOVIE_INDEX,
            id: mongoId,
            refresh: 'true',
        });
        return true;
    } catch (e) {
        if (e instanceof EsErrors.ResponseError && e?.meta?.statusCode === 404) {
            return true;
        }
        err('deleteMovie error:', e?.message || e);
        return false;
    }
}

// =====================
// Search Movies
// =====================
// params: { q, category, language, year, minRate, maxRate, page, limit, sort }
export async function searchMovies(params = {}) {
    if (!ES_ENABLED || !es) {
        return { hits: [], total: 0, page: 1, pages: 0 };
    }

    const {
        q = '',
        category,
        language,
        year,
        minRate,
        maxRate,
        page = 1,
        limit = 10,
        sort = 'az',
    } = params;

    const filter = [];
    if (category) filter.push({ term: { 'category.raw': lc(category) } });
    if (language) filter.push({ term: { 'language.raw': lc(language) } });
    if (year) filter.push({ term: { year: Number(year) } });
    if (minRate || maxRate) {
        const range = {};
        if (minRate != null) range.gte = Number(minRate);
        if (maxRate != null) range.lte = Number(maxRate);
        filter.push({ range: { rate: range } });
    }

    // ---- Query: bool_prefix trên search_as_you_type + phao wildcard keyword ----
    const should = [];
    if (q) {
        // name autocomplete (gõ water -> Watermelon)
        should.push({
            multi_match: {
                query: q,
                type: 'bool_prefix',
                fields: [
                    'name',
                    'name._2gram',
                    'name._3gram',
                    'name._index_prefix'
                ],
                boost: 5
            }
        });
        // casts.name autocomplete
        should.push({
            multi_match: {
                query: q,
                type: 'bool_prefix',
                fields: [
                    'casts.name',
                    'casts.name._2gram',
                    'casts.name._3gram',
                    'casts.name._index_prefix'
                ],
                boost: 4
            }
        });
        // Mô tả chuẩn xác
        should.push({ match: { desc: { query: q, operator: 'and' } } });
        // Wildcard trên keyword để bắt cả substring giữa từ (không phân biệt hoa/thường)
        should.push({
            wildcard: { 'name.keyword': { value: `*${q}*`, case_insensitive: true, boost: 2 } }
        });
    }

    // ---- Sort ----
    let sortSpec = [{ 'name.keyword': 'asc' }];
    switch (String(sort).toLowerCase()) {
        case 'za': sortSpec = [{ 'name.keyword': 'desc' }]; break;
        case 'newest': sortSpec = [{ createdAt: 'desc' }]; break;
        case 'oldest': sortSpec = [{ createdAt: 'asc' }]; break;
        case 'rate_desc': sortSpec = [{ rate: 'desc' }]; break;
        case 'rate_asc': sortSpec = [{ rate: 'asc' }]; break;
    }

    const from = Math.max(0, (Number(page) - 1) * Number(limit));
    const size = Math.max(1, Number(limit));

    try {
        const resp = await es.search({
            index: ES_MOVIE_INDEX, // alias "movies" đã trỏ v2
            from,
            size,
            query: {
                bool: {
                    must: [{ match_all: {} }],
                    should,
                    minimum_should_match: q ? 1 : 0,
                    filter,
                },
            },
            sort: sortSpec,
            _source: [
                'name', 'desc', 'category', 'language', 'year', 'rate',
                'titleImage', 'image', 'isPremium', 'createdAt', 'updatedAt'
            ],
        });

        const total = typeof resp.hits.total === 'number'
            ? resp.hits.total
            : resp.hits.total?.value || 0;

        const hits = (resp.hits.hits || []).map(h => ({
            _id: h._id,
            ...h._source,
            _score: h._score,
        }));

        return {
            hits,
            total,
            page: Number(page),
            pages: Math.ceil(total / size),
            limit: size,
        };
    } catch (e) {
        err('searchMovies error:', e?.message || e);
        return { hits: [], total: 0, page: 1, pages: 0, error: e?.message || String(e) };
    }
}


// =====================
// Helpers: ES count / Mongo count
// =====================
async function esCount() {
    if (!ES_ENABLED || !es) return 0;
    try {
        const r = await es.count({ index: ES_MOVIE_INDEX });
        return typeof r.count === 'number' ? r.count : 0;
    } catch {
        return 0;
    }
}

async function mongoCount() {
    try {
        const { default: Movie } = await import('../Models/MoviesModel.js'); // chỉnh path nếu cần
        return await Movie.countDocuments({});
    } catch {
        return 0;
    }
}

// =====================
// Backfill toàn bộ phim từ MongoDB sang ES
// =====================
export async function syncAllMoviesToES(batchSize = 500) {
    if (!ES_ENABLED || !es) return { ok: false, reason: 'ES disabled' };
    try {
        const { default: Movie } = await import('../Models/MoviesModel.js'); // chỉnh path nếu cần
        const total = await Movie.countDocuments({});
        let processed = 0;

        while (processed < total) {
            const docs = await Movie.find({})
                .skip(processed)
                .limit(batchSize)
                .lean();

            const shaped = docs.map((d) => ({ _id: String(d._id), ...d }));
            const resp = await bulkUpsertMovies(shaped);
            if (!resp.ok) {
                return { ok: false, error: resp.error || 'bulk error' };
            }
            processed += docs.length;
            log(`Sync ES: ${processed}/${total}`);
        }
        return { ok: true, total };
    } catch (e) {
        return { ok: false, error: e?.message || String(e) };
    }
}

// =====================
// Đồng bộ các phim bị thiếu (so sánh ID)
// =====================
export async function syncMissingMoviesToES(batchSize = 1000) {
    if (!ES_ENABLED || !es) return { ok: false, reason: 'ES disabled' };
    try {
        const { default: Movie } = await import('../Models/MoviesModel.js'); 

        // 1) Lấy toàn bộ _id trong ES (scroll)
        const esIds = new Set();
        let resp = await es.search({
            index: ES_MOVIE_INDEX,
            size: 1000,
            scroll: '1m',
            _source: false,
            fields: [],
            query: { match_all: {} },
        });
        while (true) {
            (resp.hits.hits || []).forEach((h) => esIds.add(h._id));
            const scrollId = resp._scroll_id;
            if (!resp.hits.hits?.length) break;
            resp = await es.scroll({ scroll_id: scrollId, scroll: '1m' });
        }

        // 2) Lấy toàn bộ _id trong Mongo (chỉ _id)
        const mongoIds = await Movie.find({}, { _id: 1 }).lean();
        const missingIds = mongoIds
            .map((d) => String(d._id))
            .filter((id) => !esIds.has(id));

        if (!missingIds.length) {
            log('Sync ES: no missing documents');
            return { ok: true, added: 0 };
        }

        // 3) Lấy chi tiết các missing và bulk upsert theo batch
        let added = 0;
        for (let i = 0; i < missingIds.length; i += batchSize) {
            const chunk = missingIds.slice(i, i + batchSize);
            const docs = await Movie.find({ _id: { $in: chunk } }).lean();
            const shaped = docs.map((d) => ({ _id: String(d._id), ...d }));
            const r = await bulkUpsertMovies(shaped);
            if (!r.ok) return { ok: false, error: r.error || 'bulk error' };
            added += shaped.length;
            log(`Sync missing ES: +${added}/${missingIds.length}`);
        }

        return { ok: true, added };
    } catch (e) {
        return { ok: false, error: e?.message || String(e) };
    }
}

// =====================
// Tự động đồng bộ khi cần
// - Nếu ES trống nhưng Mongo > 0 => backfill full
// - Nếu ES < Mongo => đồng bộ phần thiếu
// =====================
export async function autoSyncIfNeeded() {
    try {
        const [ec, mc] = await Promise.all([esCount(), mongoCount()]);
        log(`AutoSync check — ES: ${ec} docs, Mongo: ${mc} docs`);

        if (mc === 0) return; // Mongo trống thì thôi
        if (ec === 0) {
            log('ES empty, backfilling from Mongo...');
            await syncAllMoviesToES(500);
            return;
        }
        if (ec < mc) {
            log('ES missing some docs, syncing missing ones...');
            await syncMissingMoviesToES(1000);
        }
    } catch (e) {
        warn('autoSyncIfNeeded error:', e?.message || e);
    }
}

// =====================
// Khởi tạo tự động khi import
// =====================
(async () => {
    if (!ES_ENABLED) {
        warn('Elasticsearch is disabled by ES_ENABLED=false');
        return;
    }
    const ok = await esPing();
    if (!ok) {
        warn('Elasticsearch not reachable:', ES_NODE);
        return;
    }
    // Movie init
    await ensureIndex();
    await ensureKeywordSubfields();
    await autoSyncIfNeeded(); 

    // Series init
    await ensureSeriesIndex();
    await ensureSeriesKeywordSubfields();
    await autoSyncSeriesIfNeeded();
})();


//-------------------- SERIES ------------------------//
export async function ensureSeriesIndex() {
    if (!ES_ENABLED || !es) return false;
    try {
        const exists = await es.indices.exists({ index: ES_SERIES_INDEX });
        if (exists) return true;

        await es.indices.create({
            index: ES_SERIES_INDEX,
            settings: {
                analysis: {
                    normalizer: {
                        vi_fold_norm: {
                            type: 'custom',
                            char_filter: [],
                            filter: ['lowercase', 'asciifolding'],
                        },
                    },
                    analyzer: {
                        vi_ngram: {
                            type: 'custom',
                            tokenizer: 'ngram',
                            filter: ['lowercase', 'asciifolding'],  
                        },
                        vi_standard: {  
                            type: 'custom',
                            tokenizer: 'standard',
                            filter: ['lowercase', 'asciifolding'],
                        },
                    },
                    tokenizer: {
                        ngram: {
                            type: 'ngram',
                            min_gram: 2,
                            max_gram: 20,
                            token_chars: ['letter', 'digit'],
                        },
                    },
                },
            },
            mappings: {
                properties: {
                    name: {
                        type: 'text',
                        analyzer: 'vi_ngram',
                        search_analyzer: 'vi_standard',  
                        fields: {
                            keyword: { type: 'keyword', ignore_above: 256 },
                            raw: { type: 'keyword', normalizer: 'vi_fold_norm' },
                        },
                    },
                    category: {
                        type: 'keyword',
                        fields: {
                            raw: { type: 'keyword', normalizer: 'vi_fold_norm' } 
                        }
                    },
                    language: {
                        type: 'keyword',
                        fields: {
                            raw: { type: 'keyword', normalizer: 'vi_fold_norm' } 
                        }
                    },
                    casts: {
                        properties: {
                            name: {
                                type: 'text',
                                analyzer: 'vi_ngram',
                                search_analyzer: 'vi_standard',  
                                fields: {
                                    keyword: { type: 'keyword', ignore_above: 256 },
                                    raw: { type: 'keyword', normalizer: 'vi_fold_norm' },
                                },
                            },
                            // ... 
                        },
                    },
                },
            },
        });

        log(`Index "${ES_SERIES_INDEX}" created`);
        return true;
    } catch (e) {
        if (e?.meta?.body?.error?.type === 'resource_already_exists_exception') {
            return true;
        }
        err('ensureSeriesIndex error:', e?.message || e);
        return false;
    }
}

export async function ensureSeriesKeywordSubfields() {
    if (!ES_ENABLED || !es) return false;
    try {
        const mapping = await es.indices.getMapping({ index: ES_SERIES_INDEX });
        const props = mapping?.[ES_SERIES_INDEX]?.mappings?.properties || {};

        const hasName = !!props?.name;
        const hasNameKeyword = props?.name?.fields?.keyword?.type === 'keyword';
        const hasCastsNameKeyword =
            props?.casts?.properties?.name?.fields?.keyword?.type === 'keyword';

        if (hasNameKeyword && hasCastsNameKeyword) {
            return true;
        }

        const nameAnalyzer = props?.name?.analyzer || 'vi_ngram';
        const nameSearchAnalyzer = props?.name?.search_analyzer || 'standard';
        const castsNameAnalyzer =
            props?.casts?.properties?.name?.analyzer || 'vi_ngram';
        const castsNameSearchAnalyzer =
            props?.casts?.properties?.name?.search_analyzer || 'standard';

        const body = { properties: {} };

        if (hasName && !hasNameKeyword) {
            body.properties.name = {
                type: 'text',
                analyzer: nameAnalyzer,
                search_analyzer: nameSearchAnalyzer,
                fields: {
                    ...(props?.name?.fields || {}),
                    keyword: { type: 'keyword', ignore_above: 256 },
                },
            };
        }

        if (!hasCastsNameKeyword) {
            body.properties.casts = {
                properties: {
                    name: {
                        type: 'text',
                        analyzer: castsNameAnalyzer,
                        search_analyzer: castsNameSearchAnalyzer,
                        fields: {
                            ...(props?.casts?.properties?.name?.fields || {}),
                            keyword: { type: 'keyword', ignore_above: 256 },
                        },
                    },
                },
            };
        }

        if (!Object.keys(body.properties).length) {
            log('Series mapping: Nothing to update');
            return true;
        }

        await es.indices.putMapping({
            index: ES_SERIES_INDEX,
            body,
        });

        log('Series mapping updated: added missing *.keyword subfields');
        return true;
    } catch (e) {
        warn('ensureSeriesKeywordSubfields error:', e?.message || e);
        return false;
    }
}

export async function upsertSeries(mongoId, series) {
    if (!ES_ENABLED || !es || !mongoId) return false;
    try {
        await es.index({
            index: ES_SERIES_INDEX,
            id: mongoId,
            document: {
                name: series?.name,
                desc: series?.desc,
                category: series?.category,
                language: series?.language,
                year: Number(series?.year) || null,
                rate: Number(series?.rate) || 0,
                titleImage: series?.titleImage || null,
                image: series?.image || null,
                isPremium: !!series?.isPremium,
                casts: Array.isArray(series?.casts)
                    ? series.casts.map((c) => ({
                        name: c?.name,
                        image: c?.image || null,
                        role: c?.role || null,
                    }))
                    : [],
                createdAt: series?.createdAt ? new Date(series.createdAt) : undefined,
                updatedAt: new Date(),
            },
            refresh: 'true',
        });
        return true;
    } catch (e) {
        err('upsertSeries error:', e?.message || e);
        return false;
    }
}

export async function bulkUpsertSeries(docs = []) {
    if (!ES_ENABLED || !es || !Array.isArray(docs) || !docs.length)
        return { ok: false };
    try {
        const body = [];
        for (const s of docs) {
            if (!s?._id) continue;
            body.push({ index: { _index: ES_SERIES_INDEX, _id: String(s._id) } });
            body.push({
                name: s.name,
                desc: s.desc,
                category: s.category,
                language: s.language,
                year: Number(s.year) || null,
                rate: Number(s.rate) || 0,
                titleImage: s.titleImage || null,
                image: s.image || null,
                isPremium: !!s.isPremium,
                casts: Array.isArray(s.casts)
                    ? s.casts.map((c) => ({
                        name: c?.name,
                        image: c?.image || null,
                        role: c?.role || null,
                    }))
                    : [],
                createdAt: s.createdAt ? new Date(s.createdAt) : undefined,
                updatedAt: new Date(),
            });
        }

        const resp = await es.bulk({ refresh: 'true', operations: body });
        if (resp.errors) {
            const items = resp.items?.filter((it) => it.index?.error);
            warn('bulkUpsertSeries: some errors', items?.slice(0, 3));
        }
        return { ok: !resp.errors };
    } catch (e) {
        err('bulkUpsertSeries error:', e?.message || e);
        return { ok: false, error: e?.message || String(e) };
    }
}

export async function deleteSeries(mongoId) {
    if (!ES_ENABLED || !es || !mongoId) return false;
    try {
        await es.delete({
            index: ES_SERIES_INDEX,
            id: mongoId,
            refresh: 'true',
        });
        return true;
    } catch (e) {
        if (e instanceof EsErrors.ResponseError && e?.meta?.statusCode === 404) {
            return true;
        }
        err('deleteSeries error:', e?.message || e);
        return false;
    }
}

export async function searchSeries(params = {}) {
    if (!ES_ENABLED || !es) return { hits: [], total: 0, page: 1, pages: 0 };

    const {
        q = "",
        category,
        language,
        year,
        minRate,
        maxRate,
        page = 1,
        limit = 10,
        sort = "az",
    } = params;

    const filter = [];
    if (category) filter.push({ term: { 'category.raw': lc(category) } }); 
    if (language) filter.push({ term: { 'language.raw': lc(language) } });
    if (year) filter.push({ term: { year: Number(year) } });
    if (minRate || maxRate) {
        const range = {};
        if (minRate != null) range.gte = Number(minRate);
        if (maxRate != null) range.lte = Number(maxRate);
        filter.push({ range: { rate: range } });
    }

    const should = [];
    if (q) {
        should.push({
            multi_match: {
                query: q,
                type: "best_fields",
                fields: ["name^4", "casts.name^3", "desc"],
                operator: "and",
                fuzziness: "AUTO",
            },
        });

        // 2) phrase prefix (autocomplete đầu từ)
        should.push({
            multi_match: {
                query: q,
                type: "phrase_prefix",
                fields: ["name^5", "casts.name^4"],
            },
        });

        // 3) wildcard substring (không phân biệt hoa/thường)
        should.push({
            wildcard: { "name.keyword": { value: `*${q}*`, case_insensitive: true, boost: 2 } },
        });
        should.push({
            wildcard: { "casts.name.keyword": { value: `*${q}*`, case_insensitive: true, boost: 1.5 } },
        });

        // 4) prefix (nếu q dài >= 2)
        if (q.length >= 2) {
            should.push({ prefix: { "name.keyword": { value: q.toLowerCase() } } });
            should.push({ prefix: { "casts.name.keyword": { value: q.toLowerCase() } } });
        }
    }

    // ---- Sort ----
    let sortSpec = [{ "name.keyword": "asc" }];
    switch (String(sort).toLowerCase()) {
        case "za": sortSpec = [{ "name.keyword": "desc" }]; break;
        case "newest": sortSpec = [{ createdAt: "desc" }]; break;
        case "oldest": sortSpec = [{ createdAt: "asc" }]; break;
        case "rate_desc": sortSpec = [{ rate: "desc" }]; break;
        case "rate_asc": sortSpec = [{ rate: "asc" }]; break;
    }

    const from = Math.max(0, (Number(page) - 1) * Number(limit));
    const size = Math.max(1, Number(limit));

    try {
        const resp = await es.search({
            index: ES_SERIES_INDEX,
            from,
            size,
            query: {
                bool: {
                    must: [{ match_all: {} }],
                    should,
                    minimum_should_match: q ? 1 : 0,
                    filter,
                },
            },
            sort: sortSpec,
            _source: [
                "name", "desc", "category", "language", "year", "rate",
                "titleImage", "image", "isPremium", "createdAt", "updatedAt", "casts"
            ],
        });

        const total = typeof resp.hits.total === "number"
            ? resp.hits.total
            : resp.hits.total?.value || 0;

        const hits = (resp.hits.hits || []).map(h => ({
            _id: h._id,
            ...h._source,
            _score: h._score,
        }));

        return {
            hits,
            total,
            page: Number(page),
            pages: Math.ceil(total / size),
            limit: size,
            sort,
        };
    } catch (e) {
        // 👇 LOG LỖI CHI TIẾT để debug khi cần
        console.warn("[ES] searchSeries error:", e?.meta?.body?.error || e?.message || e);
        return { hits: [], total: 0, page: 1, pages: 0, error: e?.message || String(e) };
    }
}

async function esSeriesCount() {
    if (!ES_ENABLED || !es) return 0;
    try {
        const r = await es.count({ index: ES_SERIES_INDEX });
        return typeof r.count === 'number' ? r.count : 0;
    } catch {
        return 0;
    }
}

async function mongoSeriesCount() {
    try {
        const { default: Series } = await import('../Models/SeriesModel.js');
        return await Series.countDocuments({});
    } catch {
        return 0;
    }
}

export async function syncAllSeriesToES(batchSize = 500) {
    if (!ES_ENABLED || !es) return { ok: false, reason: 'ES disabled' };
    try {
        const { default: Series } = await import('../Models/SeriesModel.js');
        const total = await Series.countDocuments({});
        let processed = 0;

        while (processed < total) {
            const docs = await Series.find({})
                .skip(processed)
                .limit(batchSize)
                .lean();

            const shaped = docs.map((d) => ({ _id: String(d._id), ...d }));
            const resp = await bulkUpsertSeries(shaped);
            if (!resp.ok) {
                return { ok: false, error: resp.error || 'bulk error' };
            }
            processed += docs.length;
            log(`Sync Series ES: ${processed}/${total}`);
        }
        return { ok: true, total };
    } catch (e) {
        return { ok: false, error: e?.message || String(e) };
    }
}

export async function syncMissingSeriesToES(batchSize = 1000) {
    if (!ES_ENABLED || !es) return { ok: false, reason: 'ES disabled' };
    try {
        const { default: Series } = await import('../Models/SeriesModel.js');

        // 1) lấy toàn bộ _id trong ES
        const esIds = new Set();
        let resp = await es.search({
            index: ES_SERIES_INDEX,
            size: 1000,
            scroll: '1m',
            _source: false,
            fields: [],
            query: { match_all: {} },
        });
        while (true) {
            (resp.hits.hits || []).forEach((h) => esIds.add(h._id));
            const scrollId = resp._scroll_id;
            if (!resp.hits.hits?.length) break;
            resp = await es.scroll({ scroll_id: scrollId, scroll: '1m' });
        }

        // 2) lấy toàn bộ _id trong Mongo
        const mongoIds = await Series.find({}, { _id: 1 }).lean();
        const missingIds = mongoIds
            .map((d) => String(d._id))
            .filter((id) => !esIds.has(id));

        if (!missingIds.length) {
            log('Sync Series ES: no missing documents');
            return { ok: true, added: 0 };
        }

        // 3) nạp chi tiết & bulk upsert
        let added = 0;
        for (let i = 0; i < missingIds.length; i += batchSize) {
            const chunk = missingIds.slice(i, i + batchSize);
            const docs = await Series.find({ _id: { $in: chunk } }).lean();
            const shaped = docs.map((d) => ({ _id: String(d._id), ...d }));
            const r = await bulkUpsertSeries(shaped);
            if (!r.ok) return { ok: false, error: r.error || 'bulk error' };
            added += shaped.length;
            log(`Sync missing Series ES: +${added}/${missingIds.length}`);
        }

        return { ok: true, added };
    } catch (e) {
        return { ok: false, error: e?.message || String(e) };
    }
}

export async function autoSyncSeriesIfNeeded() {
    try {
        const [ec, mc] = await Promise.all([esSeriesCount(), mongoSeriesCount()]);
        log(`AutoSync Series — ES: ${ec} docs, Mongo: ${mc} docs`);

        if (mc === 0) return;
        if (ec === 0) {
            log('Series ES empty, backfilling from Mongo...');
            await syncAllSeriesToES(500);
            return;
        }
        if (ec < mc) {
            log('Series ES missing some docs, syncing missing ones...');
            await syncMissingSeriesToES(1000);
        }
    } catch (e) {
        warn('autoSyncSeriesIfNeeded error:', e?.message || e);
    }
}
