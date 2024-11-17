/**
 * Constructors for domain elements
 *
 * Gero Wedemann, Hochschule Stralsund
 *
 * TODO: door state
 * TODO: i18n
 */
"use strict";

const Position = require('./models/position');
const Door = require('./models/door');
const Person = require('./models/person');
const Thing = require('./models/thing');
const Message = require('./models/message');

exports.Position = Position;
exports.Door = Door;
exports.Person = Person;
exports.Thing = Thing;
exports.Message = Message;

let persons =[];
let firstPosition;

exports.getFirstPosition = function() {
    return firstPosition;
};

exports.getPersons = function(){
    return persons;
};

exports.getPerson = function(name){
    for (let person of persons) {
        if (person.name==name) { return (person); }
    }
    throw new Error("user \"" + name + "\" not found");
};


/**
 * creates the gamefield with all players. This will change significantly in the final version.
 * Do not rely on its actual version.
 * @param users which should be added as players
 */
exports.createModel = function(users) {
    if (persons.length != 0) { //construct only once
        return;
    }
    const garten1 = new exports.Position("Garten", "LawnGreen", "Ein schöner Garten. Vor Ihnen steht ein prächtiges Haus.");
    const garten2 = new exports.Position("Garten mit Sträuchern", "ForestGreen", "Ein schöner Garten mit Sträuchern");
    const vorraum = new exports.Position("Einfacher Raum", "LightGrey", "Ein karger Raum");
    const schatzkammer = new exports.Position("Schatzkammer", "Gold", "Schätze ohne Ende. Wir sind reich!");
    const thronraum = new exports.Position("Thronraum", "Purple", "Ein prächtig ausgestatter Raum mit einem großen Thron");
    firstPosition = garten1;

    const key = new exports.Thing("Schlüssel");

    new exports.Door(garten1, "e", garten2, false);
    new exports.Door(garten1, "n", vorraum);
    new exports.Door(vorraum, "e", schatzkammer, true, false, true, [key]);
    new exports.Door(vorraum, "n", thronraum);

    garten1.things.push(new exports.Thing("Blume"));
    vorraum.things.push(key);
    schatzkammer.things.push(new exports.Thing("Ring"));
    schatzkammer.things.push(new exports.Thing("Krone"));

    for (let user of users) {
        persons.push(new exports.Person(user.name, garten1));
    }
};
