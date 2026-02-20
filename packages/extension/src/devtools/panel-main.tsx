import React from 'react';
import { createRoot } from 'react-dom/client';
import { Panel } from './Panel';
import '../styles.css';

const root = createRoot(document.getElementById('root')!);
root.render(<Panel />);
