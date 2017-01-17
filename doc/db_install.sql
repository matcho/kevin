create table object(
	id serial primary key,
	name varchar(128) not null,
	id_tm varchar(128),
	id_tb varchar(32)
);

create table element(
	id serial primary key,
	name varchar(128) not null,
	url varchar(256)
);

create table trait(
	id serial primary key,
	fk_element bigint references element(id) not null,
	name varchar(128) not null,
	url varchar(256),
	multiple boolean not null default false
);

create table value(
	id serial primary key,
	fk_trait bigint references trait(id) not null,
	name varchar(128) not null,
	url varchar(256),
	valid boolean not null default false
);

create table vote(
	id serial primary key,
	fk_object bigint references object(id) not null,
	fk_value bigint references value(id) not null,
	user_email varchar(128),
	undefined_user_id varchar(256),
	user_id varchar(256) not null
);
alter table vote add constraint vote_uq unique (fk_object, fk_value, user_id);

create function set_user_id() returns trigger as $set_user_id$
	begin
		if new.undefined_user_id is not null then
			new.user_id:= new.undefined_user_id;
		end if;
		if new.user_email is not null then
			new.user_id:= new.user_email;
		end if;
		return new;
	end;
$set_user_id$ language plpgsql;

create trigger vote_insert after insert
	on vote
	for each row
	execute procedure set_user_id();
