<?php
// Load thư viện PHPMailer
require_once __DIR__ . '/../Libs/PHPMailer/src/Exception.php';
require_once __DIR__ . '/../Libs/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/../Libs/PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class MailService
{
    private string $username = 'phule.31231027390@st.ueh.edu.vn';
    private string $password = 'zylp pexi ybyf tmrf';
    private string $fromName = 'NewsPulse System';

    public function sendOTP(string $toEmail, string $otpCode): bool
    {
        if (empty($this->username) || empty($this->password)) {
            // Nếu chưa cấu hình, báo lỗi luôn để dev biết
            throw new Exception("Vui lòng mở file Repo/Services/MailService.php để điền Email và App Password trước khi test gửi thư.");
        }

        $mail = new PHPMailer(true);
        try {
            // Cấu hình SMTP
            $mail->isSMTP();
            $mail->Host       = 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = $this->username;
            $mail->Password   = $this->password;
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            $mail->Port       = 465;
            $mail->CharSet    = 'UTF-8';

            // Người gửi & Người nhận
            $mail->setFrom($this->username, $this->fromName);
            $mail->addAddress($toEmail);

            // Nội dung Email
            $mail->isHTML(true);
            $mail->Subject = '[NewsPulse] Ma xac nhan khoi phuc mat khau';
            $mail->Body    = "
                <div style='font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 500px; margin: 0 auto;'>
                    <h2 style='color: #002D5E; text-align: center;'>Khôi phục mật khẩu</h2>
                    <p>Chào bạn,</p>
                    <p>Hệ thống nhận được yêu cầu khôi phục mật khẩu cho tài khoản liên kết với email này. Dưới đây là mã OTP xác thực của bạn:</p>
                    <div style='text-align: center; margin: 20px 0;'>
                        <span style='font-size: 24px; font-weight: bold; background: #f0f4f8; padding: 10px 20px; border-radius: 8px; color: #d9534f; letter-spacing: 5px;'>{$otpCode}</span>
                    </div>
                    <p style='color: #888; font-size: 14px;'>Mã này có hiệu lực trong vòng 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
                    <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;'/>
                    <p style='font-size: 12px; color: #aaa; text-align: center;'>Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này.</p>
                </div>
            ";
            $mail->AltBody = "Mã xác nhận khôi phục mật khẩu của bạn là: {$otpCode}. Mã có hiệu lực trong 5 phút.";

            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log("Lỗi gửi email: {$mail->ErrorInfo}");
            throw new Exception("Không thể gửi email OTP. " . $mail->ErrorInfo);
        }
    }
}
