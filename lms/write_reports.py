import os

path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src', 'pages', 'Reports.jsx')

content = r"""import { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useApp } from '../context/AppContext';
import { Mail, Send, CheckCircle, Clock, AlertTriangle, TrendingUp, Download } from 'lucide-react';

const COLORS = {
  Registered: '#6366f1', Forwarded: '#06b6d4', 'Under Review': '#f59e0b',
  Responded: '#10b981', Closed: '#94a3b8',
  Draft: '#94