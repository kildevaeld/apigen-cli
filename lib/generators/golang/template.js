"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const apigen_compiler_1 = require("apigen-compiler");
const hbs = require("handlebars");
const _ = require("lodash");
const helpers = require('handlebars-helpers');
var temp;
(function (temp) {
    function register(hbs, o) {
        hbs.registerHelper("mimetype", (context) => {
            let e = check(context, apigen_compiler_1.Type.Endpoint);
            try {
                let found = e.findPropertyValue("mime", apigen_compiler_1.StringExpression);
                if (found)
                    found.value;
            }
            catch (e) {
                console.error(e);
            }
            let body = e.findProperty('body');
            if (!body)
                return "";
            return mimeFromBody(body.value);
        });
        hbs.registerHelper("hasQuery", (ctx, options) => {
            const e = check(ctx, apigen_compiler_1.Type.Endpoint);
            if (e.findProperty("query"))
                return options.fn(ctx);
            return null;
        });
        hbs.registerHelper("hasAuth", (ctx, options) => {
            const e = check(ctx, apigen_compiler_1.Type.Package);
            if (e.auth)
                return options.fn(ctx);
            //if (e.findProperty("query")) return options.fn(ctx)
            return null;
        });
        hbs.registerHelper("hasReturn", (ctx, options) => {
            const e = check(ctx, apigen_compiler_1.Type.Endpoint);
            if (e.findProperty("return"))
                return options.fn(ctx);
            return null;
        });
        hbs.registerHelper("hasBody", (ctx, options) => {
            const e = check(ctx, apigen_compiler_1.Type.Endpoint);
            if (e.findProperty("body"))
                return options.fn(ctx);
            return null;
        });
        hbs.registerHelper("url", (context, options) => {
            let e = check(context, apigen_compiler_1.Type.Package);
            const url = e.children.find((m) => m.type == apigen_compiler_1.Type.Url);
            return url ? `${url.protocol}://${url.domain}` : "\"\"";
        });
        hbs.registerHelper("typestring", (context) => {
            try {
                let e = check(context, apigen_compiler_1.Type.Array);
                return o.typeToString(e);
            }
            catch (e) {
                //console.log(e)
            }
            if (o.typeToString)
                return o.typeToString(context);
            return "<undefined>";
        });
        hbs.registerHelper("property", function (end, prop, options) {
            const e = check(end, apigen_compiler_1.Type.Endpoint);
            return o.typeToString(e.findProperty(prop), e);
        });
        hbs.registerHelper("eachEndpoint", (context, options) => {
            var ret = "";
            for (var i = 0, j = context.length; i < j; i++) {
                if (context[i].type !== apigen_compiler_1.Type.Endpoint)
                    continue;
                ret = ret + options.fn(context[i]);
            }
            return ret;
        });
        hbs.registerHelper('eachObject', (ctx, opts) => {
            let e;
            try {
                e = temp.check(ctx, apigen_compiler_1.Type.Object);
            }
            catch (e) {
                console.error(e);
                return "";
            }
            return e.value.map((m, i) => {
                let ee = temp.check(m, apigen_compiler_1.Type.Property);
                return opts.fn({
                    name: ee.name,
                    type: o.typeToString ? o.typeToString(ee.value) : "nothing",
                    lastIndex: i + 1 === e.value.length,
                    optional: ee.optional,
                    imported: ee.value.imported
                });
            }).filter(m => m != null).join('');
        });
        hbs.registerHelper('eachDefinition', (context, options) => {
            var ret = "";
            for (var i = 0, j = context.length; i < j; i++) {
                if (context[i].type !== apigen_compiler_1.Type.Definition)
                    continue;
                let o = context[i];
                if (o.value.type == apigen_compiler_1.Type.SimpleAuthentication || o.value.type == apigen_compiler_1.Type.TokenAuthentication)
                    continue;
                ret = ret + options.fn({
                    name: o.name,
                    isObject: o.value.type == apigen_compiler_1.Type.Object,
                    value: o.value
                });
            }
            return ret;
        });
        hbs.registerHelper('equal', function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            }
            else {
                return options.fn(this);
            }
        });
        hbs.registerHelper('json', (ctx) => {
            return JSON.stringify(ctx);
        });
        hbs.registerHelper('camelcase', (ctx) => {
            return _.upperFirst(_.camelCase(ctx));
        });
        hbs.registerHelper('getproperty', (ctx, prop) => {
            const find = (m) => m.type != apigen_compiler_1.Type.Property && m.name == prop;
            try {
                let e = check(ctx, apigen_compiler_1.Type.Endpoint);
            }
            catch (e) {
                try {
                    console.log(ctx, prop);
                    let p = check(ctx, apigen_compiler_1.Type.Package);
                    let found = p.children.find(find);
                    console.log(found);
                    if (found)
                        return found.value.value;
                }
                catch (e) {
                }
            }
            return "";
        });
    }
    function check(e, t) {
        if (e.type !== t)
            throw new Error(`invalid type: ${e.constructor.name} should be: ${t}`);
        return e;
    }
    temp.check = check;
    function findProperty(e, name, t) {
        if (e.type != apigen_compiler_1.Type.Endpoint)
            throw new Error('not a endpoint');
        const found = e.children.find(m => m.type == apigen_compiler_1.Type.Property && m.name === name);
        if (!t)
            return found;
        if (!(found.value instanceof t))
            throw new Error("invalid property type");
        return found.value;
    }
    temp.findProperty = findProperty;
    function mimeFromBody(b) {
        switch (b.type) {
            case apigen_compiler_1.Type.Primitive:
                const e = check(b, apigen_compiler_1.Type.Primitive);
                switch (e.value) {
                    case apigen_compiler_1.Primitive.String, apigen_compiler_1.Primitive.Boolean: return "plain/text";
                    case apigen_compiler_1.Primitive.Binary: return "application/octet-stream";
                }
            case apigen_compiler_1.Type.Object:
                return "application/json";
        }
        return "application/octet-stream";
    }
    temp.mimeFromBody = mimeFromBody;
    function handlebars(o = {}) {
        const h = hbs.create();
        helpers({
            handlebars: h,
        });
        register(h, o);
        return h;
    }
    temp.handlebars = handlebars;
})(temp = exports.temp || (exports.temp = {}));
