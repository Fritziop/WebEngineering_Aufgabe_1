"use strict";

let player = {
    name: " ",
    position: { x:30, y:30},
    inventory: []
};

/**
 * Die Funktion ermöglicht das Aufheben von Gegenständen aus einem Raum
 * @param name Name des Items, was aufgehoben werden soll
 */
async function pickUp(name) {
    const pickUpResponse = await fetch('/api/person/thing', {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "name": name,
        })
    })
    const responseToString = JSON.stringify(await pickUpResponse.json(), null, 0)

    if (!pickUpResponse.ok) {
        alert((`FEHLER beim Aufheben:\n`+responseToString)
            .replace(/[{}]/g,"")
            .trim() + '\n Objekt: '+name);
        await getRoomData();
    }else{
        player.inventory.push(name);
        await getRoomData();
        updateInventory();
    }
}

/**
 * Die Funktion ermöglicht das Weglegen von Gegenständen aus dem Inventar
 * @param name Name des Gegenstands, der weggelegt werden soll
 */
async function dropDown(name) {
    const dropDownResponse = await fetch('/api/position/thing', {
        method: "POST",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "name": name,
        })

    })
    if (!dropDownResponse.ok) {
        alert(`FEHLER beim Weglegen:\n${JSON.stringify(await dropDownResponse.json(), null, 0)}`
            .replace(/[{}]/g,"")
            .trim() + '\n Objekt: '+name);
        await loadPlayerInfo();
    }else{
        player.inventory.splice(player.inventory.indexOf(name), 1);
        await getRoomData();
        updateInventory();
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
            }
        }
    }
}

//fertig, evtl. für grafische Gestaltung noch anpassen
async function unlockDoor(direction)
{
    let i = 0;
    let locked = true
    while (i<=player.inventory.length && locked) {

        const openResponse = await fetch('/api/door/'+direction, {
            method: "PATCH",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "action": "unlock",
                "key": player.inventory[i]
            })
        });
        const responseToString = JSON.stringify(await openResponse.json(), null, 0);

        i++;

        if (!openResponse.ok) {
            console.log(`Fehler beim Aufschließen der Tür: `+ responseToString);
            alert((`FEHLER beim Aufschließen der Tür:\n ` + responseToString)
                .replace(/[{}]/g,"")
                .trim() + '\n Richtung: '+ direction);
            return false;
        } else {
            locked = false;
            await changeDoorStatus(direction, open)
        }
    }
}

//fertig
async function changeDoorStatus(direction, action, key)
{
    const response = await fetch('/api/door/'+direction, {
        method: "PATCH",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "action": "open",
            "key": key
        })
    });
    const responseToString = JSON.stringify(await response.json(), null, 0);

    if(!response.ok)
    {
        console.log(`Fehler beim Ändern des Türstatuses: `+ responseToString);
        alert((`FEHLER beim Ändern des Türstatuses:\n ` + responseToString)
            .replace(/[{}]/g,"")
            .trim() + '\n Richtung: '+ direction);
        return false;
    }
}

async function loadPlayerInfo() {
        const response = await fetch('/api/person', {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        const playerData = await response.json();
        const responseToString = JSON.stringify(playerData, null, 0);

        if (!response.ok) {
            console.log(`FEHLER beim Laden der Spielerinformationen: `+ responseToString);
            alert((`FEHLER beim Laden der Spielerinformationen:\n ` + responseToString)
                .replace(/[{}]/g,"")
                .trim());
            return false;
        }

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

async function getRoomData()
{
    try {
        const response = await fetch('/api/position', {
            method: 'GET',
            headers: { 'Accept': 'application/json',
                'Cache-Control': 'no-cache',}
        });

        if (!response.ok) {
            throw new Error(`Fehler beim Laden der Spielerinformationen: ${response.status}`);
        }

        const playerData = await response.json();

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

        playerData.directions.forEach(item => {
            const listItem = document.createElement("button");
            listItem.textContent = item;
            directionsList.appendChild(listItem);
        });

    } catch (error) {
        console.error("Fehler:", error);
    }
}


async function renderMap() {
    const mapElement = document.getElementById("map");
    mapElement.innerHTML = "";  // Karte zurücksetzen

        const response = await fetch('/api/position', {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            alert("FEHLER beim Laden der Positionsdaten!")
        }

        const roomData = await response.json();

        for (let y = 0; y < 61; y++) {
            for (let x = 0; x < 61; x++) {

                const cell = document.createElement("div");
                cell.id = y +" "+x;
                cell.classList.add("cell");
                mapElement.appendChild(cell);
            }
        }
        markPlayerPosition(roomData);
}

/**
 * Die Funktion baut das Spiel am Anfang auf, indem sie einmal alle wichtigen Informationen abruft
 * @returns {Promise<void>}
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