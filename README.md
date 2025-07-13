# Rope Survival - Cuộc Chiến Sinh Tồn Trên Sợi Dây

Chào mừng bạn đến với **Rope Survival**, một trò chơi sinh tồn dựa trên cơ chế vật lý đầy thử thách và kịch tính. Nhiệm vụ của bạn là điều khiển một quả bóng treo trên sợi dây, khéo léo né tránh những lưỡi cưa sắc lẹm không ngừng lao tới.

Nhưng bạn không hề đơn độc trong cuộc chiến này! Ngay bên cạnh là một **trợ lý AI** do Gemini cung cấp, vừa là đối thủ đáng gờm đang thi đấu song song, vừa là một bình luận viên lắm lời, luôn sẵn sàng châm chọc mỗi sai lầm và tung hô những pha xử lý thần sầu của bạn.

## 🚀 Tính năng nổi bật

*   **Lối chơi Vật lý Thực tế:** Trải nghiệm cảm giác điều khiển sợi dây co dãn, dao động một cách tự nhiên theo từng cử động chuột của bạn.
*   **Đối đầu với AI:** Thử thách bản thân bằng cách thi đấu song song với một người chơi AI. Liệu bạn có thể đạt điểm cao hơn nó?
*   **Độ khó Thông minh do AI điều khiển:** Các lưỡi cưa không di chuyển theo một khuôn mẫu nhàm chán. Genkit và Gemini sẽ liên tục tạo ra những quy luật di chuyển mới, từ đơn giản đến phức tạp và hung hãn, khiến mỗi màn chơi đều là một thử thách mới.
*   **Bình luận viên AI Hài hước:** Trợ lý AI không chỉ chơi game mà còn bình luận về mọi hành động của bạn bằng tiếng Việt, với những câu nói dí dỏm, châm biếm và đôi khi là... khó nghe. Bạn thậm chí có thể "chửi lộn" tay đôi với nó!
*   **Hệ thống Tính điểm Dựa trên Sự mạo hiểm:** Bạn càng liều lĩnh, điểm càng cao. Lướt qua lưỡi cưa trong gang tấc sẽ mang lại điểm số vượt trội so với việc chỉ chơi an toàn ở xa.
*   **Tùy chỉnh & Nâng cấp:** Mua các loại dây với hiệu ứng độc đáo và mua thêm mạng sống để kéo dài cuộc chơi.
*   **Chế độ Tạm dừng:** Dừng cuộc chơi bất cứ lúc nào để nghỉ ngơi hoặc để... tập trung "tranh luận" với bình luận viên AI mà không bị làm phiền.

## 🛠️ Công nghệ sử dụng

*   **Frontend:** Next.js, React, TypeScript
*   **Styling:** Tailwind CSS, ShadCN UI
*   **Generative AI:** Google Gemini, Genkit
*   **Rendering:** HTML5 Canvas

## ⚙️ Hướng dẫn Cài đặt và Chạy Game

Để trải nghiệm Rope Survival trên máy của bạn, hãy làm theo các bước sau:

### 1. Yêu cầu hệ thống

*   [Node.js](https://nodejs.org/) (phiên bản 18.x trở lên)
*   `npm` hoặc `yarn`

### 2. Cài đặt

Đầu tiên, sao chép (clone) mã nguồn của dự án về máy tính của bạn:
```bash
git clone <URL_CỦA_REPOSITORY>
cd <TÊN_THƯ_MỤC_DỰ_ÁN>
```

Tiếp theo, cài đặt các gói phụ thuộc cần thiết:
```bash
npm install
```
hoặc
```bash
yarn install
```

### 3. Cấu hình Môi trường

Trò chơi sử dụng API của Google Gemini để tạo ra các thử thách và bình luận. Bạn cần có một API Key.

1.  **Lấy API Key:** Truy cập [Google AI Studio](https://aistudio.google.com/app/apikey) để tạo API Key của bạn.
2.  **Tạo tệp môi trường:** Tạo một tệp mới ở thư mục gốc của dự án và đặt tên là `.env.local`.
3.  **Thêm API Key:** Mở tệp `.env.local` và thêm vào nội dung sau, thay thế `YOUR_GOOGLE_API_KEY` bằng key bạn vừa tạo:

    ```
    GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY
    ```

### 4. Chạy Game

Sau khi hoàn tất cài đặt và cấu hình, khởi động máy chủ phát triển (development server):

```bash
npm run dev
```

Bây giờ, hãy mở trình duyệt và truy cập vào [http://localhost:9002](http://localhost:9002) để bắt đầu cuộc chiến sinh tồn của bạn! Chúc bạn may mắn và có những giây phút "khó đỡ" với trợ lý AI của chúng tôi!
