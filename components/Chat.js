import React, { Fragment, useState, useEffect } from 'react'
import axios from 'axios'
import Pusher from 'pusher-js'
import ChatMessage from './ChatMessage'

const Chat = props => {
    const { activeUser: user } = props
    const pusher = new Pusher(process.env.PUSHER_APP_KEY, {
        cluster: process.env.PUSHER_APP_CLUSTER,
        encrypted: true
    })
    const channel = pusher.subscribe('chat-room')
    const [state, setState] = useState({ chats: [] })
    useEffect(() => {
        channel.bind('new-message', ({ chat = null }) => {
            const { chats } = state
            chat && chats.push(chat)
            setState({ chats })
        })

        pusher.connection.bind('connected', () => {
            axios.post('/messages').then(response => setState({ chats: response.data.messages }))
        })

        return () => pusher.disconnect()
    }, [state, setState, pusher, channel])

    const handleKeyUp = async (evt) => {
        const value = evt.target.value

        if (evt.keyCode === 13 && !evt.shiftKey) {
            const { activeUser: user } = props
            const chat = { user, message: value, timestamp: +new Date }

            evt.target.value = ''
            await axios.post('/message', chat)
        }
    }

    return (props.activeUser && <>

        <div className="border-bottom border-gray w-100 d-flex align-items-center bg-white" style={{ height: 90 }}>
            <h2 className="text-dark mb-0 mx-4 px-2">{props.activeUser}</h2>
        </div>

        <div className="px-4 pb-4 w-100 d-flex flex-row flex-wrap align-items-start align-content-start position-relative" style={{ height: 'calc(100% - 180px)', overflowY: 'scroll' }}>

            {state.chats.map((chat, index) => {
                const previous = Math.max(0, index - 1)
                const previousChat = state.chats[previous]
                const position = chat.user === props.activeUser ? "right" : "left"

                const isFirst = previous === index
                const inSequence = chat.user === previousChat.user
                const hasDelay = Math.ceil((chat.timestamp - previousChat.timestamp) / (1000 * 60)) > 1

                return (
                    <Fragment key={index}>
                        { (isFirst || !inSequence || hasDelay) && (
                            <div className={`d-block w-100 font-weight-bold text-dark mt-4 pb-1 px-1 text-${position}`} style={{ fontSize: '0.9rem' }}>
                                <span>{chat.user || 'Anonymous'}</span>
                            </div>
                        ) }
                        <ChatMessage message={chat.message} position={position} obscure={chat.points && chat.user !== user} />
                    </Fragment>
                )
            })}
        </div>
        <div className="border-top border-gray w-100 px-4 d-flex align-items-center bg-light" style={{ minHeight: 90 }}>
            <textarea className="form-control px-3 py-2" onKeyUp={handleKeyUp} placeholder="Enter a ticket number, some points or a chat message" style={{ resize: 'none' }} />
        </div>
    </> )
}

export default Chat
