"use strict";
document.addEventListener("DOMContentLoaded", () => {
    /*loadPlayerInfo();*/
});

let player = {
    name: " ",
    position: { x:30, y:30},
    inventory: []
};

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
    if (pickUpResponse.ok) {
        player.inventory.push(name);
        await getRoomData();
        updateInventory();
    }
}

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
    if (dropDownResponse.ok) {
        player.inventory.splice(player.inventory.indexOf(name), 1);
        await getRoomData();
        updateInventory();
    }
}

async function movePlayer(direction) {
    try {
        const doorResponse = await fetch('/api/door/'+direction, {
            method: "GET",
            headers: { 'Accept': 'application/json',
                'Cache-Control': 'no-cache',}
        });

        if (!doorResponse.ok) {
            throw new Error(`Fehler beim Bedienen der Tür: ${doorResponse.status}`);
        }

        const doorData = await doorResponse.json();
        if (doorData.locked) {
            let i = 0;
            while (i<=player.inventory.length && doorData.locked) {
                console.log(player.inventory[i]);

                const openResponse = await fetch('/api/door/e', {
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

                i++;

                if (!openResponse.ok) {
                    throw new Error(`Fehler: ${openResponse.status}`);

                } else {
                    doorData.locked = false;
                    await fetch('/api/door/e', {
                        method: "PATCH",
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            "action": "open",
                            "key": null
                        })
                    });
                }
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

        for (let y = 0; y < 61; y++) {
            for (let x = 0; x < 61; x++) {
                const cell = document.getElementById(y +" "+x);
                cell.classList.remove("player");


                if (x === player.position.x && y === player.position.y) {
                    cell.classList.remove("cellbackground");
                    cell.style.backgroundColor = roomData.color;
                    cell.classList.add("player");
                }
            }
        }


    } catch (error) {
        console.error("Fehler:", error);
    }
}



async function loadPlayerInfo() {
    try {
        const response = await fetch('/api/person', {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Fehler beim Laden der Spielerinformationen: ${response.status}`);
        }

        const playerData = await response.json();

        // Spielername und Inventar aktualisieren
        updatePlayerInfo(playerData.name, playerData.things);
    } catch (error) {
        console.error("Fehler:", error);
    }
}

function updatePlayerInfo(name, things) {
    // Spielername anzeigen
    document.getElementById("playerName").textContent = name;
    // Inventar anzeigen
    const inventoryElement = document.getElementById("inventory");
    inventoryElement.innerHTML = "";

    things.forEach(item => {
        player.inventory.push(item.name);
        updateInventory();
    });
}

function updateInventory()
{
    const inventoryElement = document.getElementById("inventory");
    inventoryElement.innerHTML = "";

    player.inventory.forEach(item => {
        const listItem = document.createElement("button");
        listItem.textContent = item;
        listItem.addEventListener("click", ()=> dropDown(item).then(getRoomData));
        inventoryElement.appendChild(listItem);
    });
}

function initGame() {
    loadPlayerInfo();
    renderMap();
    getRoomData();

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
            const listItem = document.createElement("li");
            listItem.textContent = item;
            directionsList.appendChild(listItem);
        });

    } catch (error) {
        console.error("Fehler:", error);
        displayError("Fehler beim Updaten.");
    }
}

async function renderMap() {
    const mapElement = document.getElementById("map");
    mapElement.innerHTML = "";  // Karte zurücksetzen

    try {
        const response = await fetch('/api/position', {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Fehler beim Laden der Spielerinformationen: ${response.status}`);
        }

        const roomData = await response.json();

        for (let y = 0; y < 61; y++) {
            for (let x = 0; x < 61; x++) {

                const cell = document.createElement("div");
                cell.id = y +" "+x;
                cell.classList.add("cell","cellbackground");


                if (x === player.position.x && y === player.position.y) {
                    cell.classList.remove("cellbackground");
                    cell.style.backgroundColor = roomData.color;
                    cell.classList.add("player");
                }
                mapElement.appendChild(cell);
            }
        }


    } catch (error) {
        console.error("Fehler:", error);
    }


}

// Bewegungsmechanismus sowohl mit Pfeiltasten als auch mit WASD
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
            event.preventDefault();d
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
window.onload(initGame());











