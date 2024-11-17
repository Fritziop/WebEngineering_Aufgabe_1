"use strict";

class Thing {
    constructor(name, load) {
        this.name = name;
        this.load = 1;
        if (load) {
            this.load = load;
        }
        this.toJSON = function() {
            return {
                name: this.name,
            };
        }
    };

    /**
     * get a reference to a thing at the position by its name.
     *
     * @param {string} thingName
     * @returns {exports.Thing}
     */
    getThing(thingName) {
        for (let theThing of this.things) {
            if (theThing.name == thingName) {
                return theThing;
            }
        }
        throw new Error("no such thing at position");
    }
}

module.exports = Thing;