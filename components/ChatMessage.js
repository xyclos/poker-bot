import React from 'react'
import PropTypes from 'prop-types'

const ChatMessage = props => {
    const { position = 'left', message } = props
    const isRight = position.toLowerCase() === 'right'
    
    const align = isRight ? 'text-right' : 'text-left'
    const justify = isRight ? 'justify-content-end' : 'justify-content-start'
    
    const messageBoxStyles = {
        maxWidth: '70%',
        flexGrow: 0
    }
    
    const messageStyles = {
        fontWeight: 500,
        lineHeight: 1.4,
        whiteSpace: 'pre-wrap'
    }
    
    return (
        <div className={`w-100 my-1 d-flex ${justify}`}>
            <div className="bg-light rounded border border-gray p-2" style={messageBoxStyles}>
            <span className={`d-block text-secondary ${align}`} style={messageStyles}>
              {props.obscure ? '❓' : message}
            </span>
            </div>
        </div>
    )
}

ChatMessage.propTypes = {
    position: PropTypes.string,
    message: PropTypes.string,
    obscure: PropTypes.bool
}

export default ChatMessage