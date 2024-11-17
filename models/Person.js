"use strict";

class Person {
    constructor(name, position) {
        this.name = name;
        this.maximLoad = 5;
        this.maximumThings = 5;
        this.position = position;
        position.persons.push(this);
        this.things=[];
        this.messages=[];
    };

    load() {
        let sum = 0;
        for (let t of this.things) {
            sum += t.load;
        }
        return sum;
    };

    go(direction){
        if (!(this.position[direction])) {
            throw new Error("direction " + direction + " not possible");
        }
        let nextDoor = this.position[direction];
        this.position.persons = this.position.persons.filter(p => p !== this);
        this.position = nextDoor.getOtherRoom(this.position);
        this.position.persons.push(this);
    };

    /**
     *
     * @param {string} aThingName
     * @returns {exports.Thing|*}
     */
    take(aThingName) {
        if ( this.things.length >= 5 ) {
            throw new Error("My knapsack is full");
        }
        let aThing = this.position.getThing(aThingName);
        if (this.load() + aThing.load > this.maximLoad) {
            throw new Error ("cannot carry more");
        }
        let thing = this.position.giveThing(aThing);
        this.things.push(thing);
        return thing;
    };

    drop(aThing){
        let thing = this.giveThing(aThing);
        this.position.things.push(thing);
        return thing;
    };

    hasThing(thing) {
        for (let aThing of this.things){
            if (thing.name == aThing.name) {
                return true;
            }
        }
        return false;
    };

    /**
     * remove a thing from this.things defined by aThing.name and return it.
     * This can be added to all objects with an Array of Thing called this.things
     * @param {exports.Thing} aThing
     * @returns {exports.Thing} the thing
     */
    giveThing(aThing){
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
            name: this.name
        };
    }
}

module.exports = Person;