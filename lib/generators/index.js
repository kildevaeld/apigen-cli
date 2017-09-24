"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const golang_1 = require("./golang");
function addGenerators(repo) {
    repo.addModule("golang", golang_1.GolangGenerator);
}
exports.addGenerators = addGenerators;
