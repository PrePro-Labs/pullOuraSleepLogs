import { poolPromise } from "./config.js";
import axios from "axios";
import { DateTime } from "luxon";

const helperFunctions = {
  getPreproLog: async function (userId, date) {
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
  getOuraAPIKey: async function (userId) {
    return new Promise(async function (resolve, reject) {
      try {
        const pool = await poolPromise;
        const [results] = await pool.query(
          `
            select * from apiUsersIntegrations where userId = ? and type = 1
            `,
          [userId]
        );

        if (results.length) {
          resolve(results[0].value);
        } else throw new Error("No Oura API key found for this user");
      } catch (e) {
        console.log(e);
        reject(e);
      }
    });
  },
  getOuraLog: async function (apiKey, date) {
    return new Promise(async function (resolve, reject) {
      try {
        const tomorrow = DateTime.fromISO(date).plus({ days: 1 }).toISODate();
        const { data: response } = await axios.get(
          `https://api.ouraring.com/v2/usercollection/sleep?start_date=${date}&end_date=${tomorrow}`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
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
  uploadToPrepro: async function (userId, date, log) {
    return new Promise(async function (resolve, reject) {
      try {
        const totalSleep = log.total_sleep_duration / 3600;
        const recoveryIndex = log.readiness.contributors.recovery_index;
        const readinessScore = log.readiness.score;

        const {
          awake_time,
          deep_sleep_duration,
          light_sleep_duration,
          rem_sleep_duration,
          time_in_bed,
        } = log;

        function formatTime(time) {
          return (time / 3600).toFixed(2);
        }

        if (!totalSleep || !recoveryIndex) {
          throw new Error("Missing data");
        }

        const pool = await poolPromise;
        await pool.query(
          `
            insert into sleepLogs (userId, date, totalSleep, recoveryIndex, readinessScore, awakeQty, remQty, lightQty, deepQty, totalBed) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
            `,
          [
            userId,
            date,
            totalSleep,
            recoveryIndex,
            readinessScore,
            formatTime(awake_time),
            formatTime(rem_sleep_duration),
            formatTime(light_sleep_duration),
            formatTime(deep_sleep_duration),
            formatTime(time_in_bed),
          ]
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
