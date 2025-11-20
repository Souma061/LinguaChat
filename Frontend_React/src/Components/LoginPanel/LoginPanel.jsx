import React from 'react'
import { useState } from 'react'
import { useChatContext } from '../../context/ChatContext'
import { parseUrlParams, updateUrlParams, LANGUAGES,DEMO_ROOM } from '../../utils/helper'
import styles from './LoginPanel.module.css'



function LoginPanel() {
  const {joinChatRoom,users} = useChatContext()
  const [username,setUsername] = useState(params.username || '');
  const [room,setRoom] = useState(params.room || '');
  const [language,setLanguage] = useState('en');

  



}

export default LoginPanel
