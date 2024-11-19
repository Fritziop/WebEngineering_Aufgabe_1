"use strict";

//lokal gespeicherter Player, welchen das Spiel die Position, das Inventar und den Namen zwischenspeichert
let player = {
    name: " ",
    position: { x:30, y:30},
    inventory: []
};

//------------------------------------------------------- API-Funktionen -------------------------------------------------------
/**
 * Die Funktion stellt eine Grundstruktur für den Aufruf von POST/PATCH an dei API dar, je nach Parametern lässt sich Art und Inhalt wählen
 * @param API API-Struktur: alles was nach /api/ kommen soll
 * @param method Angabe ob es POST oder PATCH sein soll
 * @param body Der Body, welcher übergeben werden soll
 * @returns {Promise<any>} Die Antwort des Servers, falls kein Fehler vorliegt
 * @throws Error Falls die Antwort des Servers nicht positiv ausfällt wird ein Fehler geworfen
 */
async function PostPatchAPI(API, method, body) {
    const response = await fetch('/api/'+API, {
        method: method,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: body
    });
    if(!response.ok)
    {
        throw new Error("Fehler bei der API-Anfrage bezüglich /api/"+API+"\n"+JSON.stringify(await response.json(), null, 0));
    }
    return response.json();
}

/**
 * Die Funktion stellt ein konfigurierbares Grundgerüst für die GET-Anfragen an die API dar
 * @param API API-Struktur: alles was nach /api/ kommen soll
 * @returns {Promise<any>} Die Antwort des Servers, falls kein Fehler vorliegt
 * @throws Error Falls die Antwort des Servers nicht positiv ausfällt wird ein Fehler geworfen
 */
async function getAPI(API) {
    const response = await fetch('/api/'+API, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
        throw new Error("Fehler bei der API-Abfrage bezüglich /api/"+API+"\n"+JSON.stringify(await response.json(), null, 0));
    }
    return await response.json();
}

//------------------------------------------------------- Gegenstands-Funktionen -------------------------------------------------------
/**
 * Die Funktion ermöglicht das Aufheben von Gegenständen aus einem Raum<br>
 * Der Raum wird nach einem Aufhebeversuch immer neugeladen
 * @param name Name des Items, was aufgehoben werden soll
 */
async function pickUp(name) {
    let body = JSON.stringify({"name": name,})
    try{
        await PostPatchAPI("person/thing","POST", body);
        player.inventory.push(name);
        updateInventory();
    }catch(err) {
        alert(err.message);
    }
    await getRoomData();
}

/**
 * Die Funktion ermöglicht das Weglegen von Gegenständen aus dem Inventar<br>
 * Falls das Weglegen nicht erfolgreich war, wird das Inventar erneut vom Server abgefragt
 * @param name Name des Gegenstands, der weggelegt werden soll
 */
async function dropDown(name) {
    let body = JSON.stringify({"name": name,});
    try{
        await PostPatchAPI("position/thing","POST", body);
        player.inventory.splice(player.inventory.indexOf(name), 1);
        await getRoomData();
        updateInventory();
    }catch(error){
        alert(error.message);
        await loadPlayerInfo();
    }
}

//------------------------------------------------------- Tür-Funktionen -------------------------------------------------------
/**
 * Die Funktion schließt eine Tür auf und öffnet sie.<br>
 * Dabei wird alles im Inventar automatisch als Schlüssel durchprobiert
 * @param direction Die Richtung in welcher die Tür liegt
 */
async function unlockDoor(direction) {
    let i = 0;
    let locked = true
    let body = JSON.stringify({
        "action": "unlock",
        "key": player.inventory[i]})

    while (i <= player.inventory.length && locked) {
        i++;
        try {
            await PostPatchAPI("door/" + direction, "PATCH", body);
            locked = false;
            await changeDoorStatus(direction, "open")
        } catch (error) {
            if (i === player.inventory.length + 1) {
                alert(error.message);
            }
        }
    }
}

/**
 *Die Funktion verschließt eine Tür, falls nötig wird sie vorher noch geschlossen<br>
 * Dabei wird alles im Inventar als möglicher Schlüssel durchprobiert
 * @param direction Die Richtung, in welcher die Tür liegt
 * @param needToClose Parameter, welcher übergibt, ob die Tür vorher noch geschlossen werden muss
 */
async function lockDoor(direction, needToClose)
{
    let i = 0;
    let unlocked = true
    const body = JSON.stringify({
        "action": "lock",
        "key": player.inventory[i]})

    if(needToClose === true)
    {
        await changeDoorStatus(direction, "close");
    }
    while (i<=player.inventory.length && unlocked) {
        i++;
        try {
            await PostPatchAPI("door/" + direction, "PATCH", body);
            unlocked = false;
        }catch(error) {
            if(i === player.inventory.length+1) {
                alert(error.message);
            }
        }
    }
}

/**
 *Die Funktion ermöglicht allgemein den Wechsel des Türstatuses<br>
 * Der Status ist per Parameter wählbar
 * @param direction Richtung in welcher die Tür liegt
 * @param action Was mit der Tür gemacht werden soll
 * @param key Schlüssel, welcher das Auf- und Abschließen benötigt wird
 */
async function changeDoorStatus(direction, action, key)
{
    const body = JSON.stringify({
        "action": action,
        "key": key})
    try {
        await PostPatchAPI("door/" + direction, "PATCH", body);
    }catch(error) {
        alert(error.message);
    }
}

//------------------------------------------------------------------------------------------------------------------------------

async function loadPlayerInfo() {


        const playerData = await getAPI("person");
        const responseToString = JSON.stringify(playerData, null, 0);

        /*if (!response.ok) {
            console.log(`FEHLER beim Laden der Spielerinformationen: `+ responseToString);
            alert((`FEHLER beim Laden der Spielerinformationen:\n ` + responseToString)
                .replace(/[{}]/g,"")
                .trim());
            return false;
        }*/
        updatePlayerInfo(playerData.name, playerData.things);
}

function updatePlayerInfo(name, things) {
    // Spielername anzeigen
    document.getElementById("playerName").textContent = name;
    // Inventar anzeigen
    const inventoryElement = document.getElementById("inventory");
    inventoryElement.innerHTML = "";

    things.forEach(item => {
        player.inventory.push(item.name);
    });
    updateInventory();
}

/**
 * Die Funktion aktualisiert das Inventar und den Nutzernamen auf der Benutzeroberfläche:
 * Darstellung in Form von Buttons, welche das Hinlegen von Dingen ermöglichen
 */
function updateInventory() {
    const inventoryElement = document.getElementById("inventory");
    inventoryElement.innerHTML = "";

    player.inventory.forEach(item => {
        const listItem = document.createElement("button");
        listItem.textContent = item;
        listItem.addEventListener("click", ()=> dropDown(item).then(getRoomData));
        inventoryElement.appendChild(listItem);
    });
}

function markLockableDoors(data)
{
    const directionsList = document.getElementById("directions");
    directionsList.innerHTML = "";

    data.directions.forEach(item => {
        const response = getAPI("person");
        if(response.name  === true && response.locked === false)
        {
            const listItem = document.createElement("button");
            listItem.textContent = item;
            directionsList.appendChild(listItem);
        }
    });
}

async function getRoomData()
{
    try {

        const playerData = await getAPI("position");

        const playerList = document.getElementById("players");
        playerList.innerHTML = "";
        const itemList = document.getElementById("things");
        itemList.innerHTML = "";
        const directionsList = document.getElementById("directions");
        directionsList.innerHTML = "";

        playerData.persons.forEach(item => {
            const listItem = document.createElement("li");
            listItem.textContent = item.name;
            playerList.appendChild(listItem);
        });

        playerData.things.forEach(item => {
            const listItem = document.createElement("button");
            listItem.textContent = item.name;
            listItem.addEventListener("click", ()=> pickUp(item.name).then(getRoomData));
            itemList.appendChild(listItem);
        });

        for(let i = 0; i < playerData.directions.length; i++)
        {
            const response = await getAPI("door/"+playerData.directions[i]);
            const listItem = document.createElement("button");
            listItem.textContent = playerData.directions[i];
            directionsList.appendChild(listItem);
            if(response.closable === true && response.locked === false) //Tür ist schließbar aber nicht abgeschlossen
            {
                listItem.style.backgroundColor = "yellow";
                listItem.addEventListener("dblclick", () => lockDoor(playerData.directions[i], response.open).then(getRoomData));  //Tür abschließen
            }
            if(response.locked === true) // Tür ist abgeschlossen
            {
                listItem.style.backgroundColor = "red";
                //Aufschließen bereits durch Durchlaufen möglich, daher nicht erneut implementiert
            }
            if(response.locked === false && response.closable === true && response.open === true)
            {
                listItem.style.backgroundColor = "green";
                listItem.addEventListener("dblclick", ()=> console.log("test"));
                listItem.addEventListener("click", ()=> changeDoorStatus(playerData.directions[i], "close").then(getRoomData));

            }


        }

    } catch (error) {
        console.error("Fehler:", error);
    }
}

/**
 * Die Funktion baut die Map auf und markiert die erste Spielerposition
 */
async function renderMap() {
    const mapElement = document.getElementById("map");
    mapElement.innerHTML = "";  // Karte zurücksetzen

    try {
        const roomData = await getAPI("position");
        for (let y = 0; y < 61; y++) {
            for (let x = 0; x < 61; x++) {
                const cell = document.createElement("div");
                cell.id = y + " " + x;
                cell.classList.add("cell");
                mapElement.appendChild(cell);
            }
        }
        markPlayerPosition(roomData);
    }catch(err) {
        alert("Seite neu laden wegen: "+err.message);
    }
}

//Muss noch angepasst werden
async function movePlayer(direction) {
    try {
        const doorResponse = await fetch('/api/door/'+direction, {
            method: "GET",
            headers: { 'Accept': 'application/json',
                'Cache-Control': 'no-cache',}
        });

        const doorData = await doorResponse.json(); //Rückgabe der API-Anfrage

        if (!doorResponse.ok) {
            alert(`FEHLER beim Gehen in eine Richtung:\n${JSON.stringify(doorData, null, 0)}`
                .replace(/[{}]/g,"")
                .trim() + '\n Richtung: '+direction);
            console.log(`Fehler beim Bewegen: ${JSON.stringify(doorData, null, 0)}`);
            return;
        }

        if (doorData.locked) {
            if(await unlockDoor(direction) === false)
            {
                return;
            }
        }
        if (!doorData.locked && !doorData.open)
        {
            if(await changeDoorStatus(direction, "open") === false)
            {
                return;
            }
        }

        const moveResponse = await fetch('/api/person?go='+direction, {
            method: 'PATCH',
            headers: { 'Accept': 'application/json' }
        });

        if (!moveResponse.ok) {
            throw new Error(`Fehler beim Bewegen des Spielers: ${moveResponse.status}`);
        }

        const roomData = await moveResponse.json();

        switch (direction) {
            case 'n':
                player.position.y--;
                break;
            case 's':
                player.position.y++;
                break;
            case 'e':
                player.position.x++;
                break;
            case 'w':
                player.position.x--;
                break;
        }

        markPlayerPosition(roomData);




    } catch (error) {
        console.error("Fehler:", error);
    }
}

/**
 * Die Funktion markiert die aktuelle Spielerposition mit einem Rahmen und fügt die Raumfarbe hinzu
 * @param responseAPI Rückgabe einer API-Anfrage, welche die Raumfarbe enthält
 */
function markPlayerPosition(responseAPI) {
    for (let y = 0; y < 61; y++) {
        for (let x = 0; x < 61; x++) {
            const cell = document.getElementById(y +" "+x);
            cell.classList.remove("player");

            if (x === player.position.x && y === player.position.y) {
                cell.style.backgroundColor = responseAPI.color;
                cell.classList.add("player");
                responseAPI.directions.forEach((direction) => {switch(direction) {
                    case "n":
                        cell.classList.add("doorTop");
                        break;
                    case "s":
                        cell.classList.add("doorBottom");
                        break;
                    case "e":
                        cell.classList.add("doorRight");
                        break;
                    case "w":
                        cell.classList.add("doorLeft");
                        break;
                }})
            }
        }
    }
}


/**
 * Die Funktion baut das Spiel am Anfang auf, indem sie einmal alle wichtigen Informationen abruft
 */
async function initGame() {
    await loadPlayerInfo();
    await renderMap();
    await getRoomData();
}

/**
 *EventListener, welcher auf die Eingaben des Nutzers bezüglich der Bewegung reagiert
 * Bewegung möglich mit WASD und den Pfeiltasten
 */
document.addEventListener("keydown", async function (event){
    switch (event.key){
        case 'w':
            await movePlayer('n');
            await getRoomData();
            break;
        case 'a':
            await movePlayer('w');
            await getRoomData();
            break;
        case 's':
            await movePlayer('s');
            await getRoomData();
            break;
        case 'd':
            await movePlayer('e');
            await getRoomData();
            break;
        case 'ArrowUp':
            event.preventDefault();
            await movePlayer('n');
            await getRoomData();
            break;
        case 'ArrowLeft':
            event.preventDefault();
            await movePlayer('w');
            await getRoomData();
            break;
        case 'ArrowDown':
            event.preventDefault();
            await movePlayer('s');
            await getRoomData();
            break;
        case 'ArrowRight':
            event.preventDefault();
            await movePlayer('e');
            await getRoomData();
            break;
    }
});

window.addEventListener("load", initGame());