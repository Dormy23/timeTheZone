import { Elysia } from 'elysia';
import { Database } from 'bun:sqlite';
import { HttpStatusCode } from 'elysia-http-status-code';

const db = new Database('timezones.sqlite');

db.query(`CREATE TABLE IF NOT EXISTS timezones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city TEXT NOT NULL UNIQUE,
    timezone TEXT NOT NULL,
    offset INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`).run();

const initialData = db.query('SELECT COUNT(*) as count FROM timezones').get();
if (initialData.count === 0) {
    const csvData = await Bun.file('timezones.csv').text();
    const lines = csvData.split('\n');
    const timezones = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
            const [timezone, offset] = line.replace(/"/g, '').split(',');
            const city = timezone.split('/').pop().replace(/_/g, ' '); // last part is city name
            return [city, timezone, parseInt(offset)/3600]; // seconds to hours
        });

    const insert = db.prepare('INSERT INTO timezones (city, timezone, offset) VALUES (?, ?, ?)');
    timezones.forEach(([city, timezone, offset]) => {
        try {
            insert.run(city, timezone, offset);
        } catch (err) {
            console.log(`Skipped duplicate entry for ${city}`);
        }
    });
}

function timeFromCity(city) {
    const zoneInfo = db.prepare('SELECT * FROM timezones WHERE LOWER(city) = ?')
        .get(city.toLowerCase());

    if (!zoneInfo) {
        throw new Error('City not found');
    }

    const now = new Date();
    const localTime = new Date(now.getTime() + (zoneInfo.offset * 3600000));

    return {
        city: zoneInfo.city,
        localTime: localTime.toISOString(),
        timezone: zoneInfo.timezone

    };
}

const app = new Elysia().use(HttpStatusCode());

app.get('/', () => {
    return {
        message: 'Welcome to TimeTheZone API'
    };
});
app.get('/time/server', () => {
    const now = new Date();
    return {
        status: 200,

        data: {
            time: now.toISOString(),
            timestamp: now.getTime()
        }
    };
});

app.get('/time', ({ query, set, httpStatus }) => {
    const { city, ip } = query;
    if (city) {
        try {
            return timeFromCity(city);
        } catch (error) {
            set.status = httpStatus.HTTP_404_NOT_FOUND;
            return {
                error: error.message
            };
        }
    }
    if (ip) {
        //TODO
        fetch('https://ipapi.co/json/')
            .then(response => response.json())
            .then(data => {
                try {
                    console.log(data);
                    return timeFromCity(data.city);
                } catch (error) {
                    set.status = httpStatus.HTTP_404_NOT_FOUND;
                    return {
                        error: error.message
                    };
                }

            })
            .catch(error => {
                console.error(error);
            });

    }
    const now = new Date();
    return {
        status: 200,
        data: {
            time: now.toISOString(),
            timestamp: now.getTime()
        }
    };
});


app.get('/time/:city', ({ params: { city } }) => {
    const zoneInfo = db.prepare('SELECT * FROM timezones WHERE LOWER(city) = ?')
        .get(city.toLowerCase());

    if (!zoneInfo) {
        return {
            status: 404,
            message: 'City not found'
        };
    }

    const now = new Date();
    const localTime = new Date(now.getTime() + (zoneInfo.offset * 3600000));

    return {
        status: 200,
        data: {
            city: zoneInfo.city,
            localTime: localTime.toISOString(),
            timezone: zoneInfo.timezone
        }
    };
});

app.get('/time/zones/all', () => {
    const timezones = db.prepare('SELECT * FROM timezones').all();
    return {
        status: 200,
        data: timezones
    };
});

app.post('/time/zones', ({ body }) => {
    try {
        const { city, timezone, offset } = body;

        const result = db.prepare(
            'INSERT INTO timezones (city, timezone, offset) VALUES (?, ?, ?)'
        ).run(city, timezone, offset);

        const newZone = db.prepare('SELECT * FROM timezones WHERE id = ?')
            .get(result.lastInsertRowId);

        return {
            status: 201,
            message: 'Timezone added ',
            data: newZone
        };
    } catch (error) {
        return {
            status: 400,
            message: 'Error to adding timezone',
            error: error.message
        };
    }
});


app.listen(3000);
console.log('Server is listening, be careful!');  