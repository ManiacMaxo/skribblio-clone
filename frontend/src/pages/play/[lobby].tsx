import { useRouter } from 'next/router'
import React, { useContext, useEffect, useRef, useState } from 'react'
import CanvasDraw from 'react-canvas-draw'
import { io } from 'socket.io-client'
import {
    Chat,
    DrawTools,
    PostGame,
    UserList,
    WordsModal
} from '../../components'
import LobbyContextProvider, {
    ILobbyContext,
    LobbyContext
} from '../../contexts/Lobby'
import styles from '../../styles/play.module.scss'

const playContext = (): JSX.Element => (
    <LobbyContextProvider>
        <Play />
    </LobbyContextProvider>
)

const Play = (): JSX.Element => {
    const {
        setSocket,
        word,
        setWord,
        colour,
        radius,
        isFinished,
        setCanDraw,
        setCanChat,
        setIsFinished,
        canDraw
    } = useContext<ILobbyContext>(LobbyContext)

    const canvasRef = useRef(null)
    const [seconds, setSeconds] = useState<number>(180)
    const [openModal, setOpenModal] = useState<boolean>(false)
    const router = useRouter()

    useEffect(() => {
        if (!router.isReady) return

        const socket = io(process.env.NEXT_PUBLIC_WS + router.asPath, {
            reconnectionAttempts: 1
        })

        setSocket(socket)
        let interval: NodeJS.Timeout

        socket.on('newRound', () => setOpenModal(true))

        socket.on('roundStart', (roundSeconds: number) => {
            setOpenModal(false)
            setSeconds(roundSeconds)

            interval = setInterval(() => {
                setSeconds((prev: number) => prev - 1)
            }, 1000)
        })

        socket.on('roundEnd', () => {
            clearInterval(interval)
            setIsFinished(true)
            setCanChat(true)
            setCanDraw(false)
        })

        socket.on('hint', (hint: string) => {
            setWord(hint)
        })
    }, [router])

    return isFinished ? (
        <PostGame />
    ) : (
        <div className={styles.root}>
            <span className={styles.timer}>{`${seconds} seconds`}</span>
            <header className={styles.header}>
                {canDraw ? (
                    <DrawTools canvas={canvasRef} />
                ) : (
                    <span className={styles.hint}>{word}</span>
                )}
            </header>
            <aside className={styles.users}>
                <UserList />
            </aside>
            <CanvasDraw
                ref={canvasRef}
                className={styles.canvas}
                hideInterface
                hideGrid
                lazyRadius={0}
                brushRadius={radius}
                brushColor={colour}
                style={{ width: '100%', height: '100%' }}
                disabled={!canDraw}
            />
            <Chat />
            <WordsModal open={openModal} />
        </div>
    )
}

export default playContext
