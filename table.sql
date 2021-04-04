CREATE TABLE accounts (
    id int NOT NULL AUTO_INCREMENT,
    date_created varchar(255) NOT NULL,
    last_login varchar(255) NOT NULL,
    last_ip varchar(255) NOT NULL,
    last_client_login varchar(255) NOT NULL,
    last_client_ip varchar(255) NOT NULL,
    api_key varchar(255) NOT NULL,
    username varchar(255) NOT NULL,
    password varchar(255) NOT NULL,
    email varchar(255) NOT NULL,
    log longblob,
    PRIMARY KEY (id)
);
