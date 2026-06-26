import React from 'react'
import { AppProvider } from './store/useAppStore'
import './app.scss'

export default function App(props: { children?: React.ReactNode }) {
  return (
    <AppProvider>
      {props.children}
    </AppProvider>
  )
}
