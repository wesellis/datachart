"""
Email Service
Handles sending emails for user invitations, password resets, notifications, etc.
"""

import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.from_email = os.getenv("FROM_EMAIL", "noreply@DataChart.com")
        self.from_name = os.getenv("FROM_NAME", "DataChart")
        
    def _create_connection(self):
        """Create SMTP connection"""
        if not self.smtp_username or not self.smtp_password:
            logger.warning("SMTP credentials not configured - emails will be simulated")
            return None
            
        try:
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            return server
        except Exception as e:
            logger.error(f"Failed to connect to SMTP server: {e}")
            return None
    
    def _send_email(self, to_email: str, subject: str, html_body: str, text_body: str = None):
        """Send email via SMTP"""
        server = self._create_connection()
        
        if not server:
            # Simulate email sending for development
            logger.info(f"[EMAIL SIMULATION] To: {to_email}, Subject: {subject}")
            logger.info(f"[EMAIL BODY] {html_body}")
            return True
            
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = to_email
            
            # Add text and HTML parts
            if text_body:
                text_part = MIMEText(text_body, "plain")
                msg.attach(text_part)
                
            html_part = MIMEText(html_body, "html")
            msg.attach(html_part)
            
            server.send_message(msg)
            server.quit()
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            if server:
                server.quit()
            return False

# Email service instance
email_service = EmailService()

async def send_user_invitation(
    email: str, 
    name: str, 
    temp_password: Optional[str] = None,
    invited_by: str = "Admin"
) -> bool:
    """Send user invitation email"""
    
    subject = "Welcome to DataChart - Your Account is Ready!"
    
    password_section = ""
    if temp_password:
        password_section = f"""
        <p><strong>Your temporary password is:</strong> <code>{temp_password}</code></p>
        <p style="color: #e74c3c; font-size: 12px;">⚠️ Please change this password after your first login for security.</p>
        """
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Welcome to DataChart</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to DataChart!</h1>
            <p style="color: #f1f1f1; margin: 10px 0 0 0; font-size: 16px;">Enterprise APM Dashboard Platform</p>
        </div>
        
        <div style="padding: 0 20px;">
            <p>Hello {name},</p>
            
            <p>You've been invited to join <strong>DataChart</strong> by {invited_by}. Your account has been created and you're ready to start building powerful dashboards!</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #667eea;">Your Account Details:</h3>
                <p><strong>Email:</strong> {email}</p>
                {password_section}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:3000/login" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Login to Your Dashboard</a>
            </div>
            
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #1976d2;">🚀 What you can do with DataChart:</h4>
                <ul style="margin: 0; padding-left: 20px;">
                    <li>Connect to multiple data sources (Snowflake, Azure, ServiceNow, Intune)</li>
                    <li>Build custom dashboards with drag-and-drop interface</li>
                    <li>Get AI-powered insights and recommendations</li>
                    <li>Monitor application performance and costs in real-time</li>
                    <li>Ensure compliance and manage risks</li>
                </ul>
            </div>
            
            <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
            
            <p>Welcome aboard!</p>
            <p><strong>The DataChart Team</strong></p>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            <p>This invitation was sent to {email}. If you believe you received this email in error, please ignore it.</p>
        </div>
    </body>
    </html>
    """
    
    return email_service._send_email(email, subject, html_body)

async def send_password_reset(
    email: str, 
    name: str, 
    temp_password: str
) -> bool:
    """Send password reset email"""
    
    subject = "DataChart - Password Reset"
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Password Reset - DataChart</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Password Reset</h1>
            <p style="color: #f1f1f1; margin: 10px 0 0 0;">DataChart</p>
        </div>
        
        <div style="padding: 0 20px;">
            <p>Hello {name},</p>
            
            <p>Your password has been reset by an administrator. You can now log in with your new temporary password.</p>
            
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #856404;">⚠️ Important Security Information</h3>
                <p><strong>Your new temporary password is:</strong> <code style="background: #f8f9fa; padding: 4px 8px; border-radius: 4px; font-weight: bold;">{temp_password}</code></p>
                <p style="color: #856404; margin-bottom: 0;"><strong>You must change this password immediately after logging in.</strong></p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:3000/login" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Login Now</a>
            </div>
            
            <div style="background: #f8d7da; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
                <p style="margin: 0; color: #721c24;"><strong>Security Tips:</strong></p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #721c24;">
                    <li>Change your password immediately after logging in</li>
                    <li>Use a strong password with at least 8 characters</li>
                    <li>Don't share your password with anyone</li>
                    <li>Log out when you're done using the system</li>
                </ul>
            </div>
            
            <p>If you didn't request this password reset or have any concerns, please contact your administrator immediately.</p>
            
            <p>Best regards,<br><strong>The DataChart Team</strong></p>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            <p>This email was sent to {email}. For security reasons, this temporary password will expire in 24 hours.</p>
        </div>
    </body>
    </html>
    """
    
    return email_service._send_email(email, subject, html_body)

async def send_welcome_email(email: str, name: str) -> bool:
    """Send welcome email to new users"""
    
    subject = "🎉 Welcome to DataChart!"
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Welcome to DataChart</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to DataChart!</h1>
            <p style="color: #f1f1f1; margin: 10px 0 0 0; font-size: 16px;">You're all set up and ready to go!</p>
        </div>
        
        <div style="padding: 0 20px;">
            <p>Hello {name},</p>
            
            <p>Congratulations! Your DataChart account is now fully activated and you're ready to start building amazing dashboards.</p>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #2e7d32;">🚀 Quick Start Guide:</h3>
                <ol style="margin: 0; padding-left: 20px;">
                    <li><strong>Connect Your Data Sources</strong> - Link Snowflake, Azure, ServiceNow, or other systems</li>
                    <li><strong>Create Your First Dashboard</strong> - Use our drag-and-drop builder</li>
                    <li><strong>Customize & Share</strong> - Make it yours and share with your team</li>
                    <li><strong>Monitor & Optimize</strong> - Track performance and costs in real-time</li>
                </ol>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:3000/app/dashboard-builder" style="background: #4caf50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin-right: 10px;">Start Building</a>
                <a href="http://localhost:3000/app/data-sources" style="background: #2196f3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Connect Data</a>
            </div>
            
            <div style="background: #f3e5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #7b1fa2;">💡 Pro Tips:</h4>
                <ul style="margin: 0; padding-left: 20px;">
                    <li>Start with our sample dashboards to get inspired</li>
                    <li>Use AI-powered insights to discover optimization opportunities</li>
                    <li>Set up alerts to stay on top of important changes</li>
                    <li>Explore our template library for quick setups</li>
                </ul>
            </div>
            
            <p>Need help? Check out our <a href="#" style="color: #667eea;">documentation</a> or reach out to our support team anytime.</p>
            
            <p>Happy dashboard building!</p>
            <p><strong>The DataChart Team</strong></p>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            <p>You're receiving this because you signed up for DataChart. Questions? Reply to this email.</p>
        </div>
    </body>
    </html>
    """
    
    return email_service._send_email(email, subject, html_body)