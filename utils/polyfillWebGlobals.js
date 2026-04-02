'use strict';

if (typeof globalThis.File === 'undefined') {
    try {
        const { File } = require('buffer');
        if (typeof File === 'function') {
            globalThis.File = File;
        }
    } catch (_) {
    }
}

module.exports = {};
