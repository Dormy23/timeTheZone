import { Elysia } from 'elysia'
import { Database } from 'bun:sqlite'

const db = new Database('timezones.sqlite')

db.query(`CREATE TABLE IF NOT EXISTS timezones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city TEXT NOT NULL UNIQUE,
    timezone TEXT NOT NULL,
    offset INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`).run()

const initialData = db.query('SELECT COUNT(*) as count FROM timezones').get()
if (initialData.count === 0) {
    const initialTimezones = [
        ['Roma', 'Europe/Rome', 1],
        ['New York', 'America/New_York', -5]
    ]
    
    const insert = db.prepare('INSERT INTO timezones (city, timezone, offset) VALUES (?, ?, ?)')
    initialTimezones.forEach(([city, timezone, offset]) => {
        insert.run(city, timezone, offset)
    })
}

const app = new Elysia()


app.get('/', () => {
    return {
        message: 'Benvenuto su TimeTheZone API'
    }
});
app.get('/time/current', () => {
    const now = new Date()
    return {
        status: 200,
        data: {
            time: now.toISOString(),
            timestamp: now.getTime()
        }
    }
})

app.get('/time/:city', ({ params: { city } }) => {
    const zoneInfo = db.prepare('SELECT * FROM timezones WHERE LOWER(city) = ?')
        .get(city.toLowerCase())
    
    if (!zoneInfo) {
        return {
            status: 404,
            message: 'Città non trovata'
        }
    }

    const now = new Date()
    const localTime = new Date(now.getTime() + (zoneInfo.offset * 3600000))

    return {
        status: 200,
        data: {
            city: zoneInfo.city,
            localTime: localTime.toISOString(),
            timezone: zoneInfo.timezone
        }
    }
})

app.get('/time/zones/all', () => {
    const timezones = db.prepare('SELECT * FROM timezones').all()
    return {
        status: 200,
        data: timezones
    }
})

app.post('/time/zones', ({ body }) => {
    try {
        const { city, timezone, offset } = body
        
        const result = db.prepare(
            'INSERT INTO timezones (city, timezone, offset) VALUES (?, ?, ?)'
        ).run(city, timezone, offset)

        const newZone = db.prepare('SELECT * FROM timezones WHERE id = ?')
            .get(result.lastInsertRowId)

        return {
            status: 201,
            message: 'Fuso orario aggiunto con successo',
            data: newZone
        }
    } catch (error) {
        return {
            status: 400,
            message: 'Errore nell\'inserimento del fuso orario',
            error: error.message
        }
    }
})

app.listen(3000)