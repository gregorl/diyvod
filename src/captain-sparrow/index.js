'use strict';

import moment from 'moment';

import 'captain-sparrow/util/promise';

import * as taskFactory from 'captain-sparrow/taskFactory';
import * as fs from 'captain-sparrow/fs';
import { loadOrCreate as loadOrCreateConfig }from 'captain-sparrow/config';
import logger from 'captain-sparrow/logger';

export default class CaptainSparrow {

    constructor (args, options) {
        this.args = args;
        this.options = options;
    }

    async run () {

        validateArguments(this.args);

        try {
            const configuration = await loadOrCreateConfig(this.options.config);
            var settings = modifyConfigWithCliOptions(configuration, this.options, this.args);
            const task = await taskFactory.resolve(this.args[0], settings);
            await task.execute();
        } catch (err) {
            logger.error(`Unhandled application error occurred: ${ err.stack }`);
            process.exit(-1);
        }
    };
}

function validateArguments (args) {
    if (!args.length) {
        throw new Error('Provide a task name as first argument: [tv|search]');
    }
}

function modifyConfigWithCliOptions (config, options, args) {
    if (options.since) {
        var parsedSince = moment(options.since, 'YYYY-MM-DD');
        if (!parsedSince.isValid()) {
            throw new Error('Invalid --since. Should be YYYY-MM-DD');
        }

        config.tv.episodesSince = parsedSince.toDate();
    }

    if (options.show) {
        config.shows = [ options.show ];
    }

    if (args[0] === 'search') {
        config.search.term = args.slice(-1)[0];

        if (options.save) {
            config.search.save = options.save;

            if (options.index) {
                config.search.index = options.index;
            }
        }

    }

    return config;
}