"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.momentNow = exports.constructGetQuery = exports.paginate = exports.queryAsyncTransaction = exports.queryAsync = exports.getRowResults = exports.appendSqlFilter = exports.isProd = exports.transactionify = exports.to_pg_function_query = exports.pgPool = void 0;
var moment_1 = __importDefault(require("moment"));
var pg_1 = __importDefault(require("pg"));
var pg_2 = require("../types/pg");
var isProd = process.env.NODE_ENV === 'production' ? true : false;
exports.isProd = isProd;
var test = process.env.NODE_ENV;
console.log('typeof test: ', test);
console.log('comparison: ', process.env.NODE_ENV === 'production');
var devPort = '5432';
// Set up the database pool
var pgPool = new pg_1.default.Pool({
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    host: isProd ? process.env.POSTGRES_SERVER_HOST : 'localhost',
    port: +(isProd ? (_a = process.env.POSTGRES_SERVER_PORT) !== null && _a !== void 0 ? _a : devPort : devPort),
    max: 10,
});
exports.pgPool = pgPool;
pgPool.on('error', function (err, client) {
    console.log("postgresql error: " + err);
});
pgPool.on('acquire', function (client) {
    // console.log(`postgresql client acquired`);
});
pgPool.on('connect', function (client) {
    // console.log(`postgresql client connected`);
});
/**
 * if not in production, rollback database calls that would persist changes
 * @param sql the query to run
 * @returns the query wrapped in begin/rollback
 */
var transactionify = function (sql) {
    return isProd ? sql : "begin;\n" + sql + ";\nrollback;";
};
exports.transactionify = transactionify;
/**
 * @param IConstructQueryParameters
 * @returns the sql string with parameters applied
 */
var constructGetQuery = function (_a) {
    var base = _a.base, filter = _a.filter, order = _a.order, group = _a.group, page = _a.page;
    var sql = base + " " + (filter !== null && filter !== void 0 ? filter : '') + " ";
    if (group) {
        sql += "group by " + group.join() + " ";
    }
    if (order) {
        sql += "order by " + order + " ";
    }
    if (page) {
        sql += paginate(page);
    }
    return sql;
};
exports.constructGetQuery = constructGetQuery;
/**
 *
 * @param fnName name of the database function/stored procedure
 * @param params array of stuff to be converted to postgres friendly types
 * @param expectsObjAsArray flag to convert single objects to psql formatted array
 * @returns sql string with formatted function procedure parameters
 */
var to_pg_function_query = function (fnName, params, expectsObjAsArray) {
    if (expectsObjAsArray === void 0) { expectsObjAsArray = false; }
    var newParams = [];
    params.forEach(function (p) {
        if (p === undefined || p === null) {
            newParams.push('null');
        }
        else if (typeof p === 'string') {
            newParams.push(to_pg_str(p));
        }
        else if (typeof p === 'number') {
            newParams.push(p);
        }
        else if (typeof p.getMonth === 'function') {
            newParams.push(to_pg_timestamp(p));
        }
        else if (typeof p === 'object' && expectsObjAsArray) {
            newParams.push(convert_obj_to_pg_array(p));
        }
        else if (Array.isArray(p)) {
            newParams.push(to_pg_array(p));
        }
        else if (typeof p === 'object') {
            newParams.push(to_pg_obj(p));
        }
    });
    return "select bctw." + fnName + "(" + newParams.join() + ")";
};
exports.to_pg_function_query = to_pg_function_query;
// converts a js array to the postgres format
// ex. ['abc','def'] => '{abc, def}'
var to_pg_array = function (arr) {
    return "'{" + arr.join(',') + "}'";
};
var to_pg_timestamp = function (date) { return "to_timestamp(" + date + " / 1000)"; };
var momentNow = function () { return moment_1.default().format('YYYY-MM-DD HH:mm:ss'); };
exports.momentNow = momentNow;
// stringifies a single object into a psql friendly array of objects
var convert_obj_to_pg_array = function (objOrArray) {
    var asArr = Array.isArray(objOrArray) ? objOrArray : [objOrArray];
    return "'" + JSON.stringify(asArr) + "'";
};
// converts an empty string to null, otherwise returns the string
var to_pg_str = function (str) {
    if (!str)
        return "''";
    return "'" + str + "'";
};
/// returns object in psql format '{}'
var to_pg_obj = function (obj) {
    return "'" + JSON.stringify(obj) + "'";
};
/*
 the <transactionify> function will add multiple row types to the query result.
 this function handles dev and prod query result parsing
*/
var getRowResults = function (data, functionName) {
    if (Array.isArray(data)) {
        var filtered = data.find(function (result) { return result.command === 'SELECT'; });
        if (!filtered) {
            return [];
        }
        else
            return _getQueryResult(filtered, functionName);
    }
    return _getQueryResult(data, functionName);
};
exports.getRowResults = getRowResults;
var _getQueryResult = function (data, fn) {
    return data.rows.map(function (row) { return row[fn]; });
};
var queryAsync = function (sql) { return __awaiter(void 0, void 0, void 0, function () {
    var client, res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, pgPool.connect()];
            case 1:
                client = _a.sent();
                _a.label = 2;
            case 2:
                _a.trys.push([2, , 4, 5]);
                return [4 /*yield*/, client.query(sql)];
            case 3:
                res = _a.sent();
                return [3 /*break*/, 5];
            case 4:
                client.release();
                return [7 /*endfinally*/];
            case 5: return [2 /*return*/, res];
        }
    });
}); };
exports.queryAsync = queryAsync;
var queryAsyncTransaction = function (sql) { return __awaiter(void 0, void 0, void 0, function () {
    var client, res, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, pgPool.connect()];
            case 1:
                client = _a.sent();
                _a.label = 2;
            case 2:
                _a.trys.push([2, 5, 7, 8]);
                return [4 /*yield*/, client.query(sql)];
            case 3:
                res = _a.sent();
                return [4 /*yield*/, client.query('commit')];
            case 4:
                _a.sent();
                return [3 /*break*/, 8];
            case 5:
                err_1 = _a.sent();
                return [4 /*yield*/, client.query('rollback')];
            case 6:
                _a.sent();
                throw err_1;
            case 7:
                client.release();
                return [7 /*endfinally*/];
            case 8: return [2 /*return*/, res];
        }
    });
}); };
exports.queryAsyncTransaction = queryAsyncTransaction;
// hardcoded primary key getter given a table name
var _getPrimaryKey = function (table) {
    switch (table) {
        case pg_2.TelemetryTypes.animal:
            return 'id';
        case pg_2.TelemetryTypes.collar:
            return 'device_id';
        default:
            return '';
    }
};
/// given a page number, return a string with the limit offset
var paginate = function (pageNumber) {
    if (isNaN(pageNumber)) {
        return '';
    }
    var limit = 10;
    var offset = limit * pageNumber - limit;
    return "limit " + limit + " offset " + offset + ";";
};
exports.paginate = paginate;
var appendSqlFilter = function (filter, table, tableAlias, containsWhere) {
    if (containsWhere === void 0) { containsWhere = false; }
    if (!Object.keys(filter).length) {
        return '';
    }
    var sql = (containsWhere ? 'and' : 'where') + " " + (tableAlias !== null && tableAlias !== void 0 ? tableAlias : table) + ".";
    if (filter.id) {
        sql += _getPrimaryKey(table) + " = " + filter.id;
    }
    // else if (filter.search) {
    //   const search = filter.search;
    //   sql += `${search.column} = ${search.value}`;
    // }
    return sql;
};
exports.appendSqlFilter = appendSqlFilter;
//# sourceMappingURL=pg.js.map