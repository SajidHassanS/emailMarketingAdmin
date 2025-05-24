// scripts/testInactivityReminder.js
import './src/config/dbConfig.js';          // ensure DB is initialized
import { runInactivityReminder } from './src/schedulers/inactiveUserRemainder.scheduler.js';

(async () => {
    try {
        console.log('--- Running inactivity reminder test ---');
        await runInactivityReminder();
        console.log('--- Test complete ---');
        process.exit(0);
    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    }
})();
