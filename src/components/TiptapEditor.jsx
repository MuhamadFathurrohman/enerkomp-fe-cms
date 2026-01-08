import React, { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  RemoveFormatting,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ChevronDown,
  Type,
  Heading,
} from "lucide-react";
import "../sass/components/TiptapEditor/TiptapEditor.css";

const TiptapEditor = ({ value, onChange, placeholder, className = "" }) => {
  const [isEmpty, setIsEmpty] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRefs = useRef({});

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
        defaultAlignment: "left",
      }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);

      const text = editor.getText().trim();
      setIsEmpty(text.length === 0);
    },
  });

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 480);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedOutside = Object.values(dropdownRefs.current).every(
        (ref) => ref && !ref.contains(event.target)
      );

      if (clickedOutside) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
      const text = editor.getText().trim();
      setIsEmpty(text.length === 0);
    }
  }, [value, editor]);

  useEffect(() => {
    if (editor) {
      const text = editor.getText().trim();
      setIsEmpty(text.length === 0);
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ onClick, isActive, icon: Icon, title }) => (
    <button
      type="button"
      onClick={onClick}
      className={`toolbar-btn ${isActive ? "active" : ""}`}
      title={title}
    >
      <Icon size={16} />
    </button>
  );

  const CustomDropdown = ({ label, icon: DefaultIcon, items, dropdownKey }) => {
    const isOpen = openDropdown === dropdownKey;

    // Check if any item in dropdown is active
    const hasActiveItem = items.some((item) => item.isActive);

    // Get active item's icon, or use default icon
    const activeItem = items.find((item) => item.isActive);
    const DisplayIcon = activeItem ? activeItem.icon : DefaultIcon;

    const handleToggle = () => {
      const newState = isOpen ? null : dropdownKey;
      setOpenDropdown(newState);
    };

    return (
      <div
        className="custom-dropdown"
        ref={(el) => (dropdownRefs.current[dropdownKey] = el)}
      >
        <button
          type="button"
          className={`dropdown-trigger ${hasActiveItem ? "has-active" : ""}`}
          onClick={handleToggle}
        >
          <DisplayIcon size={16} />
          <span className="dropdown-label">{label}</span>
          <ChevronDown size={14} className={isOpen ? "rotate" : ""} />
        </button>

        {isOpen && (
          <div
            className="dropdown-menu"
            style={{
              position: "absolute",
              zIndex: 9999,
              display: "block",
              visibility: "visible",
              opacity: 1,
            }}
          >
            {items.map((item, index) => (
              <button
                key={index}
                type="button"
                className={`dropdown-item ${item.isActive ? "active" : ""}`}
                onClick={() => {
                  item.onClick();
                  setOpenDropdown(null);
                }}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const headingItems = [
    {
      icon: Heading1,
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive("heading", { level: 1 }),
    },
    {
      icon: Heading2,
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive("heading", { level: 2 }),
    },
    {
      icon: Heading3,
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: editor.isActive("heading", { level: 3 }),
    },
  ];

  const formatItems = [
    {
      icon: Bold,
      onClick: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold"),
    },
    {
      icon: Italic,
      onClick: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic"),
    },
    {
      icon: UnderlineIcon,
      onClick: () => editor.chain().focus().toggleUnderline().run(),
      isActive: editor.isActive("underline"),
    },
  ];

  const listItems = [
    {
      icon: ListOrdered,
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive("orderedList"),
    },
    {
      icon: List,
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive("bulletList"),
    },
  ];

  const alignItems = [
    {
      icon: AlignLeft,
      onClick: () => editor.chain().focus().setTextAlign("left").run(),
      isActive: editor.isActive({ textAlign: "left" }),
    },
    {
      icon: AlignCenter,
      onClick: () => editor.chain().focus().setTextAlign("center").run(),
      isActive: editor.isActive({ textAlign: "center" }),
    },
    {
      icon: AlignRight,
      onClick: () => editor.chain().focus().setTextAlign("right").run(),
      isActive: editor.isActive({ textAlign: "right" }),
    },
    {
      icon: AlignJustify,
      onClick: () => editor.chain().focus().setTextAlign("justify").run(),
      isActive: editor.isActive({ textAlign: "justify" }),
    },
  ];

  return (
    <div className={`tiptap-editor ${className}`}>
      {isMobile ? (
        // Mobile Toolbar with Dropdowns
        <div className="tiptap-toolbar mobile">
          <CustomDropdown
            label="H"
            icon={Heading}
            items={headingItems}
            dropdownKey="heading"
          />
          <CustomDropdown
            label="Format"
            icon={Type}
            items={formatItems}
            dropdownKey="format"
          />
          <CustomDropdown
            label="List"
            icon={List}
            items={listItems}
            dropdownKey="list"
          />
          <CustomDropdown
            label="Align"
            icon={AlignLeft}
            items={alignItems}
            dropdownKey="align"
          />
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().clearNodes().unsetAllMarks().run()
            }
            isActive={false}
            icon={RemoveFormatting}
            title="Clear Format"
          />
        </div>
      ) : (
        // Desktop Toolbar (Original)
        <div className="tiptap-toolbar">
          <div className="toolbar-group">
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              isActive={editor.isActive("heading", { level: 1 })}
              icon={Heading1}
              title="Heading 1"
            />
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              isActive={editor.isActive("heading", { level: 2 })}
              icon={Heading2}
              title="Heading 2"
            />
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              isActive={editor.isActive("heading", { level: 3 })}
              icon={Heading3}
              title="Heading 3"
            />
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive("bold")}
              icon={Bold}
              title="Bold"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive("italic")}
              icon={Italic}
              title="Italic"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive("underline")}
              icon={UnderlineIcon}
              title="Underline"
            />
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive("orderedList")}
              icon={ListOrdered}
              title="Numbered List"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive("bulletList")}
              icon={List}
              title="Bullet List"
            />
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              isActive={editor.isActive({ textAlign: "left" })}
              icon={AlignLeft}
              title="Align Left"
            />
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              isActive={editor.isActive({ textAlign: "center" })}
              icon={AlignCenter}
              title="Align Center"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              isActive={editor.isActive({ textAlign: "right" })}
              icon={AlignRight}
              title="Align Right"
            />
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().setTextAlign("justify").run()
              }
              isActive={editor.isActive({ textAlign: "justify" })}
              icon={AlignJustify}
              title="Justify"
            />
          </div>

          <div className="toolbar-divider" />

          <div className="toolbar-group">
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().clearNodes().unsetAllMarks().run()
              }
              isActive={false}
              icon={RemoveFormatting}
              title="Clear Format"
            />
          </div>
        </div>
      )}

      <div className="tiptap-editor-wrapper">
        {isEmpty && (
          <div
            className="tiptap-placeholder"
            onClick={() => editor.commands.focus()}
          >
            {placeholder || "Start writing..."}
          </div>
        )}
        <div className="tiptap-editor-content">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};

export default TiptapEditor;
