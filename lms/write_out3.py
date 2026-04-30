import os
p = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src', 'pages', 'OutgoingLetters.jsx')

# Write in parts to avoid any encoding issues
parts = []
parts.append("import { useState, useRef } from 'react';\n")
parts.append("import { Plus, Search, Eye, Edit2, Trash2, Upload, X, Paperclip, Download, Send } from 'lucide-react';\n")
parts.append("import { useApp, OFFICES } from '../context/AppContext';\n")
parts.append("import { departments, dispatchMethods, outgoingStatuses, priorities } from '../data/mockData';\n")
parts.append("import FileViewer from '../components/FileViewer'