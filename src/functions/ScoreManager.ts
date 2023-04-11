import { Snowflake } from "discord.js";
import { Manager } from "./Manager";

const fs = require('fs');
const fileName = '../../json/scores.json';
const osFile = './json/scores.json';
let { scores } = require(fileName);

export class ScoreManager extends Manager {
    constructor() {
        super();
    }

    addPoint(id1: Snowflake, id1_name: string, id2: Snowflake) {
        try {
            scores[id1].points += 1;
            scores[id1].username = id1_name;
        }
        catch (err) {
            this.createNewEntry(id1, id1_name, id2);
        }
        if (scores[id1]['transactions'][id2] == null)
            scores[id1]['transactions'][id2] = 0;
        scores[id1]['transactions'][id2] += 1;

        this.updateScoreFile();
    }

    createNewEntry(id1: Snowflake, id1_name: string, id2: Snowflake): void {
        scores[id1] = JSON.parse(`{"username":"${id1_name}","points" : 1,"transactions":{"${id2}":0}}`);
    }

    updateScoreFile() {
        let dataStr = { "scores": scores };
        try {
            fs.writeFile(osFile, JSON.stringify(dataStr), function writeJSON(err: string) {
                if (err) return console.log(err);
            });
        }
        catch (err) {
            console.log(err);
        }
    }

    clearScores() {
        scores = {};
        this.updateScoreFile();
    }

    getScore(id: Snowflake) {
        if (scores[id] == null) return 0;
        else return scores[id].points;
    }
}