import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import DynamicMapDemo from './GMapDemo.jsx'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <DynamicMapDemo/>
    </StrictMode>,
)
