"use strict";

class Position {
    constructor(name, color, description) {
        this.name = name;
        this.color = color;
        this.description = "";
        if (description) {
            this.description = description;
        }

        this.persons = [];
        this.things = [];
    }

    /**
     * @returns {Array} directions where doors are in this room
     */
    directions() {
        let d = [];
        for (let direction in this) {
            if (direction.length == 1 && /[nswe]/.test(direction)) {
                d.push(direction);
            }
        }
        return d;
    };
    /**
     * send a message to everybody in this room
     * @param sender
     * @param messageText
     * @returns {exports.Message} a copy of what was sent to all
     */
    yell(sender, messageText) {
        const m = new exports.Message(sender.name, "all", messageText);
        for (let person of this.persons) {
            person.messages.push(m);
        }
        return m;
    };

    /**
     * get a reference to a thing at the position by its name.
     * @param {exports.Thing} aThing
     * @returns {exports.Thing} the thing
     */
    getThing(thingName){
        for (let theThing of this.things) {
            if (theThing.name == thingName) {
                return theThing;
            }
        }
        throw new Error("no such thing at position");
    }

    /**
     * remove a thing from this.things defined by aThing.name and return it.
     * This can be added to all objects with an Array of Thing called this.thing
     * @param {exports.Thing} aThing
     * @returns {exports.Thing} the thing
     */
    giveThing(aThing) {
        for (let index in this.things) {
            if (this.things[index].name == aThing.name) {
                let theThing = this.things[index];
                this.things.splice(index,1);
                return theThing;
            }
        }
        throw new Error("no such thing");
    }

    toJSON() {
        return {
            name: this.name,
            color: this.color,
            description: this.description,
            directions: this.directions(),
            persons: this.persons,
            things: this.things
        }
    };

    toJSONall(positionsSoFar) {
        positionsSoFar.push(this);
        const nextRooms=[];
        for (let d of ["n", "s", "w", "e"]) {
            if (d in this) {
                let room = this[d].getOtherRoomWOCheck(this);
                if (positionsSoFar.indexOf(room) == -1 ) {
                    nextRooms.push({
                        direction: d,
                        room: (room.toJSONall(positionsSoFar))
                    });
                }
            }
        }
        return {
            name: this.name,
            color: this.color,
            persons: this.persons,
            directions: this.directions(),
            nextRooms: nextRooms
        };
    }
}

module.exports = Position;