"use strict";

/**
 * doors connection positions. It sets the references in the rooms to the doors.
 * according to exitDirectionRoom1
 * @TODO replace itsOpen etc. by state: alwaysOpen, open, closed, locked and state transitions
 */
class Door{
    /**
     *
     * @param {exports.Position} room1
     * @param exitDirectionRoom1 {String} direction from room1 to room2. Permitted values: n, s, w, e
     * @param {exports.Position} room2
     * @param {boolean} [itsClosable] true, if the door is closable
     * @param {boolean} [itsOpen] true, if the door is open
     * @param {boolean} [itsLocked] true if the door is locked. Can be opened with on of theKeys
     * @param {Thing[]} [theKeys] a list of things, that can serve as key
     */
    #closable = true;
    #open = true;
    #locked = false;
    #keys = [];
    #oppositeExit = {
        "n" : "s",
        "s" : "n",
        "w" : "e",
        "e" : "w"
    };
    #room1;
    #room2;

    constructor(room1, exitDirectionRoom1, room2, itsClosable, itsOpen, itsLocked, theKeys) {
        this.#room1 = room1;
        this.#room2 = room2;

        if ( arguments.length>3 ) {
            this.#closable = itsClosable;
        }

        if ( arguments.length>4 ) {
            if (!itsOpen && !this.#closable) {
                throw new Error("a not closable door cannot be closed");
            }
            this.#open = itsOpen;
        }

        if (arguments.length >6) {
            if (itsOpen && itsLocked) {
                throw new Error ("open door cannot be locked");
            }
            this.#locked = itsLocked;
            this.#keys = theKeys;
        }


        if (!(this.#oppositeExit.hasOwnProperty(exitDirectionRoom1))) {
            throw new Error("Not existing direction");
        }
        room1[exitDirectionRoom1]=this;
        room2[this.#oppositeExit[exitDirectionRoom1]]=this;
    };

    isOpen() {
        return this.#open;
    };

    open(key) {
        if (this.#locked) {
            throw new Error("Door is locked");
        }
        if (this.#open) {
            throw new Error("door already open");
        }
        this.#open=true;
    };
    close() {
        if (!this.#closable) {
            throw new Error("cannot close not closable door");
        }
        if (!this.#open) {
            throw new Error("cannot close already closed door");
        }
        this.#open = false;
    };

    isLocked() {
        return this.#locked;
    };

    lock( key ) {
        if (this.#open) {
            throw Error("cannot lock open door");
        }
        if (this.#locked) {
            throw Error("door already locked");
        }
        for (let aKey of this.#keys) {
            if (aKey.name == key.name) {
                this.#locked = true;
                return;
            }
        }
        throw Error("wrong key");
    };

    unlock( key ) {
        if (!this.#locked) {
            throw Error("door already unlocked");
        }
        for (let aKey of this.#keys) {
            if (aKey.name == key.name) {
                this.#locked = false;
                return;
            }
        }
        throw Error("wrong key");
    };

    getOtherRoom(room) {
        if (!this.#open) {
            throw new Error("door is closed");
        }
        return this.getOtherRoomWOCheck(room);
    };

    getOtherRoomWOCheck(room) {
        switch (room) {
            case this.#room1:
                return this.#room2;
            case this.#room2:
                return this.#room1;
            default:
                throw new Error("wrong room for this door given");
        }
    };

    toJSON() {
        return {
            "closable": this.#closable,
            "open": this.#open,
            "locked" : this.#locked
        }
    };
}

module.exports = Door;