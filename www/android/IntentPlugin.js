function IntentPlugin() {
	'use strict';
}

IntentPlugin.prototype.getCordovaIntent = function(successCallback, failureCallback) {
	'use strict';

	return cordova.exec(
		successCallback,
		failureCallback,
		"IntentPlugin",
		"getCordovaIntent", []
	);
};

IntentPlugin.prototype.setNewIntentHandler = function(method) {
	'use strict';

	cordova.exec(
		method,
		null,
		"IntentPlugin",
		"setNewIntentHandler", [method]
	);
};

IntentPlugin.prototype.getRealPathFromContentUrl = function(uri, successCallback, failureCallback) {
	'use strict'

	cordova.exec(
		successCallback,
		failureCallback,
		'IntentPlugin',
		'getRealPathFromContentUrl', [uri]
	);

}
IntentPlugin.prototype.initShare = function(handle) {
	if (typeof handle != 'function') {
		throw new Error('handle requires a function');
	}
	var _handle = function(intent) {
		if (intent.action != 'android.intent.action.SEND' && intent.action != 'android.intent.action.SEND_MULTIPLE') {
			return;
		}
		var type = intent.type, extras = intent.extras, descriptionType = intent.descriptionType;
		var result;
		if (type == 'text/plain') {
			if(descriptionType == 'text/uri-list'){
				//分享链接
				var text = extras["android.intent.extra.TEXT"];
				var m = text.match(/\s?(https?:\/\/.+)\s?/);
				result = {
					type: 'url',
					subject: extras['android.intent.extra.SUBJECT'],
					value: !!m ? m[1] : null
				};
			}else{
				if (intent.clipItems && intent.clipItems[0].uri) {
					//文本文件
					result = {
						type: 'file'
					}
				} else {
					//普通文字
					result = {
						type: 'text',
						value: extras["android.intent.extra.TEXT"] || (intent.clipItems ? intent.clipItems[0].text : '')
					};
				}
			}
		} else if (type.indexOf('image/') == 0) {
			//图片
			result = {
				type: 'image'
			}
		} else if (type.indexOf('video/') == 0) {
			result = {
				type: 'video'
			}
		} else if (type == 'message/rfc822') {
			result = {
				type: 'message',
				subject: extras["android.intent.extra.SUBJECT"],
				value: extras["android.intent.extra.TEXT"]
			};
		} else {
			result = {
				type: type
			};
		}
		var items = Array.isArray(intent.clipItems) ? intent.clipItems.map(function(o) {
			return o.uri ? {
				mimetype: o.type,
				extension: o.extension,
				uri: o.uri
			} : undefined;
		}).filter(function(o) {
			return !!o;
		}) : [];
		if(items.length != 0){
			result.items = items;
		}
		handle(null, result);
	};
	//只在应用启动时处理
	var shareOnStartup = sessionStorage.getItem('shareOnStartup');
	if (shareOnStartup != '0') {
		this.getCordovaIntent(_handle, function(err) {
			handle(err);
		});
		sessionStorage.setItem('shareOnStartup', '0');
	}

	this.setNewIntentHandler(_handle, function(err) {
		handle(err);
	});
}

module.exports = new IntentPlugin();