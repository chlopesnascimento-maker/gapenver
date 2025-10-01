import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import './RichTextEditor.css';

// A barra de ferramentas com os botões, agora com sua própria lógica interna
const Toolbar = ({ editor }) => {
  // NOVO: Um estado "fantasma" que vive APENAS dentro da Toolbar
  const [_, forceUpdate] = useState(0);

  useEffect(() => {
    if (!editor) {
      return;
    }

    // --- O CORAÇÃO DA SOLUÇÃO ---
    // Criamos uma função que força a atualização da Toolbar
    const handleUpdate = () => {
      forceUpdate(c => c + 1);
    };

    // Dizemos ao editor: "Ei, sempre que sua seleção mudar OU qualquer transação acontecer,
    // chame a nossa função handleUpdate".
    editor.on('selectionUpdate', handleUpdate);
    editor.on('transaction', handleUpdate);

    // Função de limpeza: Quando o componente for destruído, removemos os "ouvintes"
    return () => {
      editor.off('selectionUpdate', handleUpdate);
      editor.off('transaction', handleUpdate);
    };
  }, [editor]);
  
  if (!editor) {
    return null;
  }

  return (
    <div className="editor-toolbar">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'is-active' : ''}
      >
        N
      </button>
      <button
          type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'is-active' : ''}
      >
        I
      </button>
    </div>
  );
};

// O componente principal do editor (agora mais simples)
const RichTextEditor = ({ content, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose',
      },
    },
  });

  return (
    <div className="rich-text-editor">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default RichTextEditor;