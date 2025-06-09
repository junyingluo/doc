#

```c++
dispatch_io_t dispatch_io_create(dispatch_io_type_t type, dispatch_fd_t fd,
		dispatch_queue_t queue, void (^cleanup_handler)(int))
{
	if (type != DISPATCH_IO_STREAM && type != DISPATCH_IO_RANDOM) {
		return DISPATCH_BAD_INPUT;
	}
	dispatch_io_t channel = _dispatch_io_create(type);
	channel->fd = fd;
	_dispatch_channel_debug("create", channel);
	channel->fd_actual = fd;
	dispatch_suspend(channel->queue);
	_dispatch_retain(queue);
	_dispatch_retain(channel);
	_dispatch_fd_entry_init_async(fd, ^(dispatch_fd_entry_t fd_entry) {
		// On barrier queue
		int err = fd_entry->err;
		if (!err) {
			err = _dispatch_io_validate_type(channel, fd_entry->stat.mode);
		}
		if (!err && type == DISPATCH_IO_RANDOM) {
			off_t f_ptr;
			_dispatch_io_syscall_switch_noerr(err,
				f_ptr = lseek(fd_entry->fd, 0, SEEK_CUR),
				case 0: channel->f_ptr = f_ptr; break;
				default: (void)dispatch_assume_zero(err); break;
			);
		}
		channel->err = err;
		_dispatch_fd_entry_retain(fd_entry);
		_dispatch_io_init(channel, fd_entry, queue, err, cleanup_handler);
		dispatch_resume(channel->queue);
		_dispatch_release(channel);
		_dispatch_release(queue);
	});
	return channel;
}
```
