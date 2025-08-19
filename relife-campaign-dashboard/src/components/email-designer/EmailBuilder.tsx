import React, { useState, useCallback } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Type,
  Image,
  Layout,
  Square,
  MousePointer,
  Eye,
  Smartphone,
  Monitor,
  Save,
  Send,
  Trash2,
  Copy,
  Settings,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Link,
  Zap,
} from "lucide-react";

interface EmailBlock {
  id: string;
  type:
    | "text"
    | "image"
    | "button"
    | "divider"
    | "spacer"
    | "social"
    | "header"
    | "footer";
  content: any;
  styles?: any;
}

interface EmailTemplate {
  id: string;
  subject: string;
  preheader?: string;
  blocks: EmailBlock[];
  styles: {
    backgroundColor: string;
    fontFamily: string;
    maxWidth: string;
  };
}

const defaultBlocks = {
  text: {
    content: {
      text: "Your text content goes here...",
      fontSize: 16,
      color: "#333333",
      alignment: "left",
    },
    styles: {
      padding: "16px",
      backgroundColor: "transparent",
    },
  },
  image: {
    content: {
      src: "https://via.placeholder.com/600x300/6366f1/ffffff?text=Image+Placeholder",
      alt: "Image",
      href: "",
      width: "100%",
    },
    styles: {
      padding: "16px",
    },
  },
  button: {
    content: {
      text: "Call to Action",
      href: "#",
      fontSize: 16,
      color: "#ffffff",
      backgroundColor: "#6366f1",
      borderRadius: 6,
    },
    styles: {
      padding: "16px",
      textAlign: "center",
    },
  },
  divider: {
    content: {
      height: 1,
      color: "#e5e7eb",
    },
    styles: {
      padding: "16px",
    },
  },
  spacer: {
    content: {
      height: 32,
    },
    styles: {},
  },
  header: {
    content: {
      logo: "https://via.placeholder.com/150x50/6366f1/ffffff?text=Logo",
      title: "Relife Smart Alarm",
      subtitle: "Wake up refreshed every morning",
    },
    styles: {
      padding: "24px",
      backgroundColor: "#f8fafc",
      textAlign: "center",
    },
  },
  footer: {
    content: {
      companyName: "Relife Technologies",
      address: "123 Sleep Street, Dream City, DC 12345",
      unsubscribeText: "Unsubscribe from these emails",
      unsubscribeLink: "#",
    },
    styles: {
      padding: "24px",
      backgroundColor: "#f1f5f9",
      fontSize: 12,
      color: "#64748b",
      textAlign: "center",
    },
  },
};

interface EmailBuilderProps {
  initialTemplate?: EmailTemplate;
  onSave?: (template: EmailTemplate) => void;
  onSend?: (template: EmailTemplate) => void;
  className?: string;
}

export function EmailBuilder({
  initialTemplate,
  onSave,
  onSend,
  className,
}: EmailBuilderProps) {
  const [template, setTemplate] = useState<EmailTemplate>(
    initialTemplate || {
      id: "new-template",
      subject: "Your Email Subject",
      preheader: "Preview text that appears in inbox...",
      blocks: [],
      styles: {
        backgroundColor: "#ffffff",
        fontFamily: "Arial, sans-serif",
        maxWidth: "600px",
      },
    },
  );

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );

  const addBlock = useCallback((type: keyof typeof defaultBlocks) => {
    const newBlock: EmailBlock = {
      id: `block-${Date.now()}`,
      type,
      content: { ...defaultBlocks[type].content },
      styles: { ...defaultBlocks[type].styles },
    };

    setTemplate((prev) => ({
      ...prev,
      blocks: [...prev.blocks, newBlock],
    }));
  }, []);

  const updateBlock = useCallback(
    (blockId: string, updates: Partial<EmailBlock>) => {
      setTemplate((prev) => ({
        ...prev,
        blocks: prev.blocks.map((block) =>
          block.id === blockId ? { ...block, ...updates } : block,
        ),
      }));
    },
    [],
  );

  const deleteBlock = useCallback((blockId: string) => {
    setTemplate((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((block) => block.id !== blockId),
    }));
    setSelectedBlockId(null);
  }, []);

  const duplicateBlock = useCallback(
    (blockId: string) => {
      const blockToDuplicate = template.blocks.find((b) => b.id === blockId);
      if (blockToDuplicate) {
        const newBlock: EmailBlock = {
          ...blockToDuplicate,
          id: `block-${Date.now()}`,
        };
        setTemplate((prev) => ({
          ...prev,
          blocks: [...prev.blocks, newBlock],
        }));
      }
    },
    [template.blocks],
  );

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(template.blocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setTemplate((prev) => ({
      ...prev,
      blocks: items,
    }));
  };

  const selectedBlock = selectedBlockId
    ? template.blocks.find((b) => b.id === selectedBlockId)
    : null;

  const renderBlockPreview = (block: EmailBlock) => {
    switch (block.type) {
      case "text":
        return (
          <div
            style={{
              padding: block.styles?.padding,
              backgroundColor: block.styles?.backgroundColor,
              textAlign: block.content.alignment,
              fontSize: block.content.fontSize,
              color: block.content.color,
            }}
            dangerouslySetInnerHTML={{ __html: block.content.text }}
          />
        );

      case "image":
        return (
          <div style={{ padding: block.styles?.padding }}>
            {block.content.href ? (
              <a href={block.content.href}>
                <img
                  src={block.content.src}
                  alt={block.content.alt}
                  style={{ width: block.content.width, maxWidth: "100%" }}
                />
              </a>
            ) : (
              <img
                src={block.content.src}
                alt={block.content.alt}
                style={{ width: block.content.width, maxWidth: "100%" }}
              />
            )}
          </div>
        );

      case "button":
        return (
          <div
            style={{
              padding: block.styles?.padding,
              textAlign: block.styles?.textAlign,
            }}
          >
            <a
              href={block.content.href}
              style={{
                display: "inline-block",
                padding: "12px 24px",
                backgroundColor: block.content.backgroundColor,
                color: block.content.color,
                textDecoration: "none",
                borderRadius: block.content.borderRadius,
                fontSize: block.content.fontSize,
              }}
            >
              {block.content.text}
            </a>
          </div>
        );

      case "divider":
        return (
          <div style={{ padding: block.styles?.padding }}>
            <hr
              style={{
                height: block.content.height,
                backgroundColor: block.content.color,
                border: "none",
                margin: 0,
              }}
            />
          </div>
        );

      case "spacer":
        return <div style={{ height: block.content.height }} />;

      case "header":
        return (
          <div style={{ ...block.styles }}>
            <img
              src={block.content.logo}
              alt="Logo"
              style={{ maxHeight: "50px", marginBottom: "16px" }}
            />
            <h1
              style={{
                fontSize: "24px",
                margin: "0 0 8px 0",
                fontWeight: "bold",
              }}
            >
              {block.content.title}
            </h1>
            <p style={{ fontSize: "16px", margin: "0", color: "#64748b" }}>
              {block.content.subtitle}
            </p>
          </div>
        );

      case "footer":
        return (
          <div style={{ ...block.styles }}>
            <div style={{ marginBottom: "16px" }}>
              <strong>{block.content.companyName}</strong>
            </div>
            <div style={{ marginBottom: "16px" }}>{block.content.address}</div>
            <div>
              <a
                href={block.content.unsubscribeLink}
                style={{ color: "#64748b" }}
              >
                {block.content.unsubscribeText}
              </a>
            </div>
          </div>
        );

      default:
        return <div>Unknown block type</div>;
    }
  };

  const renderBlockEditor = () => {
    if (!selectedBlock) return null;

    switch (selectedBlock.type) {
      case "text":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="text-content">Content</Label>
              <Textarea
                id="text-content"
                value={selectedBlock.content.text}
                onChange={(e) =>
                  updateBlock(selectedBlock.id, {
                    content: { ...selectedBlock.content, text: e.target.value },
                  })
                }
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="font-size">Font Size</Label>
                <Input
                  id="font-size"
                  type="number"
                  value={selectedBlock.content.fontSize}
                  onChange={(e) =>
                    updateBlock(selectedBlock.id, {
                      content: {
                        ...selectedBlock.content,
                        fontSize: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="text-color">Text Color</Label>
                <Input
                  id="text-color"
                  type="color"
                  value={selectedBlock.content.color}
                  onChange={(e) =>
                    updateBlock(selectedBlock.id, {
                      content: {
                        ...selectedBlock.content,
                        color: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="text-align">Alignment</Label>
              <Select
                value={selectedBlock.content.alignment}
                onValueChange={(value) =>
                  updateBlock(selectedBlock.id, {
                    content: { ...selectedBlock.content, alignment: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "button":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="button-text">Button Text</Label>
              <Input
                id="button-text"
                value={selectedBlock.content.text}
                onChange={(e) =>
                  updateBlock(selectedBlock.id, {
                    content: { ...selectedBlock.content, text: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="button-link">Link URL</Label>
              <Input
                id="button-link"
                type="url"
                value={selectedBlock.content.href}
                onChange={(e) =>
                  updateBlock(selectedBlock.id, {
                    content: { ...selectedBlock.content, href: e.target.value },
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="button-bg">Background</Label>
                <Input
                  id="button-bg"
                  type="color"
                  value={selectedBlock.content.backgroundColor}
                  onChange={(e) =>
                    updateBlock(selectedBlock.id, {
                      content: {
                        ...selectedBlock.content,
                        backgroundColor: e.target.value,
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="button-color">Text Color</Label>
                <Input
                  id="button-color"
                  type="color"
                  value={selectedBlock.content.color}
                  onChange={(e) =>
                    updateBlock(selectedBlock.id, {
                      content: {
                        ...selectedBlock.content,
                        color: e.target.value,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>
        );

      case "image":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="image-src">Image URL</Label>
              <Input
                id="image-src"
                type="url"
                value={selectedBlock.content.src}
                onChange={(e) =>
                  updateBlock(selectedBlock.id, {
                    content: { ...selectedBlock.content, src: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="image-alt">Alt Text</Label>
              <Input
                id="image-alt"
                value={selectedBlock.content.alt}
                onChange={(e) =>
                  updateBlock(selectedBlock.id, {
                    content: { ...selectedBlock.content, alt: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="image-link">Link URL (optional)</Label>
              <Input
                id="image-link"
                type="url"
                value={selectedBlock.content.href}
                onChange={(e) =>
                  updateBlock(selectedBlock.id, {
                    content: { ...selectedBlock.content, href: e.target.value },
                  })
                }
              />
            </div>
          </div>
        );

      default:
        return <div>No editor available for this block type</div>;
    }
  };

  return (
    <div className={`flex h-full ${className}`}>
      {/* Left Sidebar - Block Library */}
      <div className="w-64 border-r bg-gray-50 p-4 overflow-y-auto">
        <h3 className="font-semibold mb-4">Add Blocks</h3>
        <div className="space-y-2">
          {Object.entries(defaultBlocks).map(([type, config]) => (
            <Button
              key={type}
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => addBlock(type as keyof typeof defaultBlocks)}
            >
              {type === "text" && <Type className="h-4 w-4 mr-2" />}
              {type === "image" && <Image className="h-4 w-4 mr-2" />}
              {type === "button" && <MousePointer className="h-4 w-4 mr-2" />}
              {type === "divider" && <Square className="h-4 w-4 mr-2" />}
              {type === "spacer" && <Layout className="h-4 w-4 mr-2" />}
              {type === "header" && <Layout className="h-4 w-4 mr-2" />}
              {type === "footer" && <Layout className="h-4 w-4 mr-2" />}
              <span className="capitalize">{type.replace("_", " ")}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Center - Email Preview */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 p-3 border rounded-lg bg-white">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-gray-100 rounded">
                <Button
                  variant={previewMode === "desktop" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPreviewMode("desktop")}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewMode === "mobile" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPreviewMode("mobile")}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSave?.(template)}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button size="sm" onClick={() => onSend?.(template)}>
                <Send className="h-4 w-4 mr-2" />
                Send Test
              </Button>
            </div>
            <Badge variant="secondary">{template.blocks.length} blocks</Badge>
          </div>

          {/* Email Subject */}
          <div className="mb-4 p-4 border rounded-lg bg-white">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  value={template.subject}
                  onChange={(e) =>
                    setTemplate((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="preheader">Preheader Text</Label>
                <Input
                  id="preheader"
                  value={template.preheader}
                  onChange={(e) =>
                    setTemplate((prev) => ({
                      ...prev,
                      preheader: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Email Canvas */}
          <div
            className={`mx-auto border rounded-lg bg-white shadow-lg ${
              previewMode === "mobile" ? "max-w-sm" : "max-w-2xl"
            }`}
            style={{
              backgroundColor: template.styles.backgroundColor,
              fontFamily: template.styles.fontFamily,
            }}
          >
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="email-canvas">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {template.blocks.map((block, index) => (
                      <Draggable
                        key={block.id}
                        draggableId={block.id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`relative group hover:outline hover:outline-2 hover:outline-blue-400 ${
                              selectedBlockId === block.id
                                ? "outline outline-2 outline-blue-500"
                                : ""
                            }`}
                            onClick={() => setSelectedBlockId(block.id)}
                          >
                            {renderBlockPreview(block)}
                            {/* Block Controls */}
                            <div
                              className={`absolute top-2 right-2 flex gap-1 transition-opacity ${
                                selectedBlockId === block.id || "group-hover:"
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            >
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateBlock(block.id);
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteBlock(block.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {/* Empty State */}
            {template.blocks.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Layout className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Drag blocks from the sidebar to start building your email</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Block Editor */}
      <div className="w-80 border-l bg-gray-50 p-4 overflow-y-auto">
        {selectedBlock ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold capitalize">
                {selectedBlock.type.replace("_", " ")} Settings
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedBlockId(null)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
            {renderBlockEditor()}
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Select a block to edit its properties</p>
          </div>
        )}
      </div>
    </div>
  );
}
