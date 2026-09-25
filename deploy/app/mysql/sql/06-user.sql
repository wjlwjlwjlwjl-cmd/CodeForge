USE db_code_forge;
insert into tb_user(nick_name, head_image, sex, email, school_name, major_name, introduce, status, create_time, update_by, update_time)
values
(
    "小明", NULL, 1, "123@456.com", "Fudan University", "CS", "Hello World", 1, now(), 1, now()
),
(
    "Bad People", NULL, 0, "456@123.com", "Fudan University", "SE", "Hello World", 0, now(), 1, now()
);