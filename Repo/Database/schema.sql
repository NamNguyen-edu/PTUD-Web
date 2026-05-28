

-- Tạo database
CREATE DATABASE IF NOT EXISTS news_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE news_db;

-- 1. ROLES — Phân quyền hệ thống

CREATE TABLE IF NOT EXISTS roles (
    role_id     INT           NOT NULL AUTO_INCREMENT,
    name        VARCHAR(50)   NOT NULL,   -- admin | editor | contributor | reader | chief editor
    description TEXT,
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (role_id),
    UNIQUE KEY UQ_roles_name (name)
) ENGINE=InnoDB;

-- Seed dữ liệu mặc định (chỉ thêm nếu chưa tồn tại)
INSERT IGNORE INTO roles (name, description) VALUES
    ('admin',        'Quản trị viên toàn quyền hệ thống'),
    ('editor',       'Biên tập viên: duyệt và xuất bản bài viết'),
    ('contributor',  'Tác giả: tạo và quản lý bài viết của mình'),
    ('chief editor', 'Biên tập viên trưởng: duyệt và xuất bản bài viết'),
    ('reader',       'Độc giả: đọc bài và bình luận');


-- 2. USERS — Người dùng

CREATE TABLE IF NOT EXISTS users (
    user_id           INT           NOT NULL AUTO_INCREMENT,
    username          VARCHAR(100)  NOT NULL,
    email             VARCHAR(255)  NOT NULL,
    password_hash     VARCHAR(255)  NOT NULL,
    full_name         VARCHAR(200),
    avatar_url        TEXT,
    bio               TEXT,
    role_id           INT           NOT NULL DEFAULT 5,  
    -- [UPDATE] Cột mới thêm: Lưu danh sách kỹ năng chuyên môn dưới dạng chuỗi JSON
    skills            TEXT          NULL,
    status            ENUM('active', 'banned', 'pending') NOT NULL DEFAULT 'pending',
    email_verified_at DATETIME      NULL,
    created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_active       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id),
    UNIQUE KEY UQ_users_username (username),
    UNIQUE KEY UQ_users_email (email),
    CONSTRAINT FK_users_role FOREIGN KEY (role_id) 
        REFERENCES roles(role_id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_users_status ON users(status);


-- 3. CATEGORIES — Danh mục bài viết

CREATE TABLE IF NOT EXISTS categories (
    category_id   INT           NOT NULL AUTO_INCREMENT,
    name          VARCHAR(150)  NOT NULL,
    slug          VARCHAR(150)  NOT NULL,
    description   TEXT,
    thumbnail_url TEXT,
    parent_id     INT           NULL,
    sort_order    INT           NOT NULL DEFAULT 0,
    is_active     TINYINT(1)    NOT NULL DEFAULT 1,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (category_id),
    UNIQUE KEY UQ_categories_slug (slug),
    CONSTRAINT FK_categories_parent FOREIGN KEY (parent_id) 
        REFERENCES categories(category_id) ON UPDATE NO ACTION ON DELETE SET NULL
) ENGINE=InnoDB;


-- 4. ARTICLES — Bài viết

CREATE TABLE IF NOT EXISTS articles (
    article_id    INT           NOT NULL AUTO_INCREMENT,
    title         VARCHAR(500)  NOT NULL,
    slug          VARCHAR(255)  NOT NULL,
    excerpt       TEXT,
    content       LONGTEXT,
    thumbnail_url TEXT,
    user_id       INT           NOT NULL,
    approved_by   INT           NULL,
    status        ENUM('draft', 'pending', 'published', 'revision', 'rejected') NOT NULL DEFAULT 'draft',
    is_featured   TINYINT(1)    NOT NULL DEFAULT 0,
    view_count    INT           NOT NULL DEFAULT 0,
    published_at  DATETIME      NULL,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (article_id),
    UNIQUE KEY UQ_articles_slug (slug),
    CONSTRAINT FK_articles_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_articles_approved_by FOREIGN KEY (approved_by) 
        REFERENCES users(user_id) ON UPDATE NO ACTION ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_published ON articles(published_at);


-- 5. TAGS — Thẻ tag

CREATE TABLE IF NOT EXISTS tags (
    tag_id      INT           NOT NULL AUTO_INCREMENT,
    name        VARCHAR(150)  NOT NULL,
    slug        VARCHAR(150)  NOT NULL,
    description TEXT,
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (tag_id),
    UNIQUE KEY UQ_tags_slug (slug)
) ENGINE=InnoDB;


-- 6. ARTICLE_CATEGORIES — Trung gian Article <-> Category

CREATE TABLE IF NOT EXISTS article_categories (
    article_id  INT NOT NULL,
    category_id INT NOT NULL,
    is_primary  TINYINT(1) NOT NULL DEFAULT 0,

    PRIMARY KEY (article_id, category_id),
    CONSTRAINT FK_ac_article FOREIGN KEY (article_id) 
        REFERENCES articles(article_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_ac_category FOREIGN KEY (category_id) 
        REFERENCES categories(category_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;


-- 7. ARTICLE_TAGS — Trung gian Article <-> Tag

CREATE TABLE IF NOT EXISTS article_tags (
    article_id INT NOT NULL,
    tag_id     INT NOT NULL,

    PRIMARY KEY (article_id, tag_id),
    CONSTRAINT FK_at_article FOREIGN KEY (article_id) 
        REFERENCES articles(article_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_at_tag FOREIGN KEY (tag_id) 
        REFERENCES tags(tag_id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;


-- 8. COMMENTS — Bình luận

CREATE TABLE IF NOT EXISTS comments (
    comment_id INT           NOT NULL AUTO_INCREMENT,
    article_id INT           NOT NULL,
    user_id    INT           NOT NULL,
    parent_id  INT           NULL,
    content    TEXT          NOT NULL,
    status     ENUM('pending', 'approved', 'spam') NOT NULL DEFAULT 'pending',
    created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (comment_id),
    CONSTRAINT FK_comments_article FOREIGN KEY (article_id) 
        REFERENCES articles(article_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT FK_comments_user FOREIGN KEY (user_id) 
        REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT FK_comments_parent FOREIGN KEY (parent_id) 
        REFERENCES comments(comment_id) ON UPDATE NO ACTION ON DELETE CASCADE
) ENGINE=InnoDB;


-- 9. MEDIA — Quản lý file

CREATE TABLE IF NOT EXISTS media (
    media_id    INT           NOT NULL AUTO_INCREMENT,
    uploaded_by INT           NOT NULL,
    filename    VARCHAR(255)  NOT NULL,
    url         TEXT          NOT NULL,
    mime_type   VARCHAR(100)  NOT NULL,
    size_bytes  INT           NOT NULL DEFAULT 0,
    alt_text    VARCHAR(255),
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (media_id),
    CONSTRAINT FK_media_uploader FOREIGN KEY (uploaded_by) 
        REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 10. ARTICLE_VERSIONS — Lưu trữ phiên bản bài viết
CREATE TABLE article_versions (
    version_id      INT AUTO_INCREMENT PRIMARY KEY,
    article_id      INT NOT NULL,
    title           VARCHAR(500),
    content         LONGTEXT,
    version_name    VARCHAR(50),
    edited_by       INT,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (article_id)
        REFERENCES articles(article_id)
        ON DELETE CASCADE,

    FOREIGN KEY (edited_by)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);
-- 11. USER_READ_HISTORY — Lưu trữ lịch sử đọc của người dùng
CREATE TABLE user_read_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,
    article_id INT NOT NULL,

    read_count INT NOT NULL DEFAULT 1,

    first_read_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    last_read_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_user_article (
        user_id,
        article_id
    ),

    CONSTRAINT fk_history_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_history_article
        FOREIGN KEY (article_id)
        REFERENCES articles(article_id)
        ON DELETE CASCADE
);