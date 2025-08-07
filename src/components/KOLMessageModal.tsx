import React, { useState } from 'react';
import { Modal } from "./ui/modal";
import Button from "./ui/button/Button";
import Label from "./form/Label";
import Input from "./form/input/InputField";
import TextArea from "./form/input/TextArea";
import { apiService } from "../services/api";
import { showToast } from "../utils/toast";

interface KOLMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  kolId: string;
  kolName: string;
}

export const KOLMessageModal: React.FC<KOLMessageModalProps> = ({
  isOpen,
  onClose,
  kolId,
  kolName,
}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      showToast.error('Message is required');
      return;
    }

    setSending(true);
    try {
      await apiService.sendKOLMessage(kolId, message, subject || undefined);
      showToast.success('Message sent successfully!');
      
      // Reset form and close modal
      setSubject('');
      setMessage('');
      onClose();
      
      // Optionally redirect to chat
      setTimeout(() => {
        const shouldOpenChat = window.confirm('Message sent! Would you like to open the chat?');
        if (shouldOpenChat) {
          window.location.href = '/chat';
        }
      }, 1000);
      
    } catch (error: any) {
      console.error('Failed to send message:', error);
      showToast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      setSubject('');
      setMessage('');
      onClose();
    }
  };

  // Pre-filled message templates
  const messageTemplates = [
    {
      subject: 'Post Schedule Reminder',
      message: `Hi ${kolName},\n\nI hope you're doing well! I wanted to follow up regarding your scheduled post that was due recently. Could you please let me know the status?\n\nIf you've already posted it, please share the link so we can update our tracking. If you need any assistance or have questions about the content, feel free to reach out.\n\nThanks!\nBest regards`
    },
    {
      subject: 'Late Post Follow-up',
      message: `Hi ${kolName},\n\nI noticed that your scheduled post is now overdue. Could you please provide an update on when we can expect it to go live?\n\nIf there are any issues or concerns preventing you from posting, please let me know so we can work together to resolve them.\n\nLooking forward to hearing from you.\nBest regards`
    },
    {
      subject: 'Campaign Check-in',
      message: `Hi ${kolName},\n\nI wanted to check in on your current campaign progress. How are things going on your end?\n\nIf you need any support, content ideas, or have questions about upcoming posts, I'm here to help.\n\nThanks for your continued partnership!\nBest regards`
    }
  ];

  const useTemplate = (template: typeof messageTemplates[0]) => {
    setSubject(template.subject);
    setMessage(template.message);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Message {kolName}
          </h3>
          <button
            onClick={handleClose}
            disabled={sending}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Message Templates */}
        <div className="mb-6">
          <Label>Quick Templates</Label>
          <div className="grid grid-cols-1 gap-2 mt-2">
            {messageTemplates.map((template, index) => (
              <button
                key={index}
                type="button"
                onClick={() => useTemplate(template)}
                disabled={sending}
                className="text-left p-3 text-sm bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50"
              >
                <div className="font-medium text-gray-900 dark:text-white">{template.subject}</div>
                <div className="text-gray-600 dark:text-gray-400 truncate">
                  {template.message.substring(0, 100)}...
                </div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subject */}
          <div>
            <Label>Subject (Optional)</Label>
            <Input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter message subject..."
              disabled={sending}
            />
          </div>

          {/* Message */}
          <div>
            <Label>Message *</Label>
            <TextArea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={8}
              disabled={sending}
              required
            />
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              This will create a new chat or continue an existing conversation with {kolName}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={sending || !message.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {sending ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};