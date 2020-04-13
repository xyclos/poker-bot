import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import Layout from '../components/Layout'
import Chat from '../components/Chat'
import Router from 'next/router'

const generateUID = () => {
    let firstPart = (Math.random() * 46656) | 0
    let secondPart = (Math.random() * 46656) | 0
    firstPart = ("000" + firstPart.toString(36)).slice(-3)
    secondPart = ("000" + secondPart.toString(36)).slice(-3)
    return firstPart + secondPart
}

const IndexPage = ({ room }) => {
    const [state, setState] = useState({ user: null })
    useEffect(() => {
        if (!room) {
            Router.push(`/?r=${generateUID()}`)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    const handleKeyUp = evt => {
        if (evt.keyCode === 13) {
            const user = evt.target.value
            setState({ user })
        }
    }
    const { user } = state
    const nameInputStyles = {
        background: 'transparent',
        color: '#999',
        border: 0,
        borderBottom: '1px solid #666',
        borderRadius: 0,
        fontSize: '3rem',
        fontWeight: 500,
        boxShadow: 'none !important'
    }
    
    return (
        <Layout pageTitle="Poker Bot">
            <main className="container-fluid position-absolute h-100 bg-dark">
                <div className="row position-absolute w-100 h-100">
                    <section
                        className="col-md-6 d-flex flex-row flex-wrap align-items-center align-content-center px-5">
                        <div className="px-5 mx-5">
                            <span className="d-block w-100 h1 text-light" style={{marginTop: -50}}>
                              { user ? (
                                  <span>
                                    <span style={{color: '#999'}}>Hello!</span> {user}
                                  </span>
                              ) : 'What is your name?' }
                            </span>
                            {!user &&
                                <input type="text" className="form-control mt-3 px-3 py-2" onKeyUp={handleKeyUp} autoComplete="off" style={nameInputStyles}/>}
                        </div>
                    </section>
                    <section
                        className="col-md-6 position-relative d-flex flex-wrap h-100 align-items-start align-content-between bg-white px-0">
                        {user && <Chat room={room} activeUser={user} />}
                    </section>
                </div>
            </main>
        </Layout>
    )
}

IndexPage.propTypes = {
    room: PropTypes.string
}

export const getServerSideProps = async ({ query }) => {
    return {
        props: { room: query.r || '' }
    }
}

export default function App (props) {
    return (
        <IndexPage {...props}/>
    )
}
