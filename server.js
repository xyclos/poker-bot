const cors = require('cors')
const next = require('next')
const Pusher = require('pusher')
const express = require('express')
const bodyParser = require('body-parser')
const dotenv = require('dotenv').config()

const dev = process.env.NODE_ENV !== 'production'
const port = process.env.PORT || 3000

const app = next({dev})
const handler = app.getRequestHandler()

const POKER_BOT = 'poker bot'

// Ensure that your pusher credentials are properly set in the .env file
// Using the specified variables
const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_APP_KEY,
    secret: process.env.PUSHER_APP_SECRET,
    cluster: process.env.PUSHER_APP_CLUSTER,
    useTLS: true
})

const reverse = s => s.split('').reverse().join('')
const getJiraTicket = s => {
    const jiraMatcher = /\d+-[A-Z]+(?!-?[a-zA-Z]{1,10})/g
    const test = reverse(s)
    const found = test.match(jiraMatcher)
    return found ? found.map(m => reverse(m))[0] : null
}

const parsePoints = s => {
    if (isNaN(parseInt(s))) {
        return 0
    } else {
        return parseInt(s)
    }
}

const revealQueues = ['reveal', 'show', 'end']

app.prepare()
    .then(() => {

        const server = express()

        server.use(cors())
        server.use(bodyParser.json())
        server.use(bodyParser.urlencoded({extended: true}))

        server.get('*', (req, res) => {
            return handler(req, res)
        })

        const chatHistory = { messages: [] };
        let pokerState = {
            ticket: '',
            votes: {}
        }

        const updatePokerState = chat => {
            if (chat.jiraTicket) {
                pokerState = { ticket: chat.jiraTicket, votes: {} }
            } else if (chat.points) {
                const votes = { ...pokerState.votes, [chat.user]: chat.points }
                pokerState = { ...pokerState, votes }
            }
        }

        const average = votes =>
            Math.round((votes.reduce((a, b) => (a + b) / votes.length) + Number.EPSILON) * 100) / 100

        const pokerBotResponse = chat => {
            if (chat.jiraTicket) {
                return {
                    user: POKER_BOT,
                    message: `Now sizing ticket ${chat.jiraTicket}. Enter your points. Enter 'reveal', 'end' or 'show' to calculate results`
                }
            }
            if (chat.message && revealQueues.includes(chat.message.trim())) {
                console.log('poker state', pokerState)
                const avg = average(Object.values(pokerState.votes))
                const votesString = Object.keys(pokerState.votes).map(k => `${k} voted ${pokerState.votes[k]}`).join('\n')
                return {
                    user: POKER_BOT,
                    message: `The results are in!\n${votesString}\naverage score: ${avg}`
                }
            }
        }

        server.post('/message', (req, res) => {
            const { user = '', message = '', timestamp = +new Date } = req.body;

            const jiraTicket = getJiraTicket(message)
            const points = parsePoints(message)

            const chat = { user, message, timestamp, jiraTicket, points };
            updatePokerState(chat);

            const botChat = pokerBotResponse(chat);
            chatHistory.messages.push(chat);

            pusher.trigger('chat-room', 'new-message', { chat });

            if (botChat) {
                setTimeout(() => {
                    chatHistory.messages.push(botChat)
                    pusher.trigger('chat-room', 'new-message', { chat: { ...botChat, timestamp: +new Date } });
                }, 500)
            }

            res.end()
        });

        server.post('/messages', (req, res) => {
            res.json({ ...chatHistory, status: 'success' });
        });

        server.listen(port, err => {
            if (err) throw err
            console.log(`> Ready on http://localhost:${port}`)
        })

    })
    .catch(ex => {
        console.error(ex.stack)
        process.exit(1)
    })