"use strict";

class Message{
    constructor(sender, recipient, messageText) {
        this.date = new Date();
        this.sender = sender;
        this.recipient = recipient;
        this.text = messageText;
    };
}

module.exports = Message;