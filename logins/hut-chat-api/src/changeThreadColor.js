"use strict";

const utils = require("../utils");
const log = require("npmlog");

// Add custom error class if not exists
if (!utils.CustomError) {
  utils.CustomError = class CustomError extends Error {
    constructor(message) {
      super(message);
      this.name = 'CustomError';
    }
  };
}

module.exports = function (defaultFuncs, api, ctx) {
  return function changeThreadColor(color, threadID, callback) {
    let resolveFunc = function () {};
    let rejectFunc = function () {};
    const returnPromise = new Promise(function (resolve, reject) {
      resolveFunc = resolve;
      rejectFunc = reject;
    });

    if (!callback) {
      callback = function (err) {
        if (err) {
          return rejectFunc(err);
        }
        resolveFunc(err);
      };
    }

    if (!isNaN(color)) {
      color = color.toString();
    }
    const validatedColor = color !== null ? color.toLowerCase() : color; // API only accepts lowercase letters in hex string

    const form = {
      dpr: 1,
      queries: JSON.stringify({
        o0: {
          //This doc_id is valid as of January 31, 2020
          doc_id: "1727493033983591",
          query_params: {
            data: {
              actor_id: ctx.i_userID || ctx.userID,
              client_mutation_id: "0",
              source: "SETTINGS",
              theme_id: validatedColor,
              thread_id: threadID,
            },
          },
        },
      }),
    };

    defaultFuncs
      .post("https://www.facebook.com/api/graphqlbatch/", ctx.jar, form)
      .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
      .then(function (resData) {
        if (resData[resData.length - 1].error_results > 0) {
          throw resData[0].o0.errors || new Error("Unknown error occurred");
        }

        return callback();
      })
      .catch(function (err) {
        log.error("changeThreadColor", err);
        return callback(err);
      });

    return returnPromise;
  };
};
