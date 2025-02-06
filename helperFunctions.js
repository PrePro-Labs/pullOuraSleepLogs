import { userId, ouraApiKey, poolPromise } from "./config.js";
import axios from "axios";
import { DateTime } from "luxon";

const helperFunctions = {
  getPreproLog: async function (date) {
    return new Promise(async function (resolve, reject) {
      try {
        const pool = await poolPromise;
        // get log
        const [logs] = await pool.query(
          `
            select * from sleepLogs where userId = ? and date = ?
            `,
          [userId, date]
        );

        resolve(logs);
      } catch (e) {
        console.log(e);
        reject(e);
      }
    });
  },
  getOuraLog: async function (date) {
    return new Promise(async function (resolve, reject) {
      try {
        const tomorrow = DateTime.fromISO(date).plus({ days: 1 }).toISODate();
        const { data: response } = await axios.get(
          `https://api.ouraring.com/v2/usercollection/sleep?start_date=${date}&end_date=${tomorrow}`,
          {
            headers: {
              Authorization: `Bearer ${ouraApiKey}`,
            },
          }
        );
        resolve(response.data);
      } catch (e) {
        console.log(e);
        reject(e);
      }
    });
  },
  uploadToPrepro: async function (date, log) {
    return new Promise(async function (resolve, reject) {
      try {
        const totalSleep = log.total_sleep_duration / 3600;
        const recoveryIndex = log.readiness.contributors.recovery_index;

        if (!totalSleep || !recoveryIndex) {
          throw new Error("Missing data");
        }

        const pool = await poolPromise;
        await pool.query(
          `
            insert into sleepLogs (userId, date, totalSleep, recoveryIndex) values (?, ?, ?, ?) 
            `,
          [userId, date, totalSleep, recoveryIndex]
        );

        resolve("success");
      } catch (e) {
        console.log(e);
        reject(e);
      }
    });
  },
};

export default helperFunctions;
