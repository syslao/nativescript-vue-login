"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var application = require("tns-core-modules/application");
var imageAssetModule = require("tns-core-modules/image-asset");
var permissions = require("nativescript-permissions");
var UriHelper = (function () {
    function UriHelper() {
    }
    UriHelper._calculateFileUri = function (uri) {
        var DocumentsContract = android.provider.DocumentsContract;
        var isKitKat = android.os.Build.VERSION.SDK_INT >= 19;
        if (isKitKat && DocumentsContract.isDocumentUri(application.android.context, uri)) {
            var docId = void 0, id = void 0, type = void 0;
            var contentUri = null;
            if (UriHelper.isExternalStorageDocument(uri)) {
                docId = DocumentsContract.getDocumentId(uri);
                id = docId.split(":")[1];
                type = docId.split(":")[0];
                if ("primary" === type.toLowerCase()) {
                    return android.os.Environment.getExternalStorageDirectory() + "/" + id;
                }
            }
            else if (UriHelper.isDownloadsDocument(uri)) {
                //id = DocumentsContract.getDocumentId(uri);
                //if (id.indexOf("raw:") !== -1) {
                //    return id.substring(4, id.length);
                //}
                //contentUri = android.content.ContentUris.withAppendedId(android.net.Uri.parse("content://downloads"), long(id));
                //return UriHelper.getDataColumn(contentUri, null, null);
                console.dir("The URI.....");
                console.log(uri);
                return UriHelper.getDataColumn(uri, null, null);

            }
            else if (UriHelper.isMediaDocument(uri)) {
                docId = DocumentsContract.getDocumentId(uri);
                var split = docId.split(":");
                type = split[0];
                id = split[1];
                if ("image" === type) {
                    contentUri = android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
                }
                else if ("video" === type) {
                    contentUri = android.provider.MediaStore.Video.Media.EXTERNAL_CONTENT_URI;
                }
                else if ("audio" === type) {
                    contentUri = android.provider.MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
                }
                var selection = "_id=?";
                var selectionArgs = [id];
                return UriHelper.getDataColumn(contentUri, selection, selectionArgs);
            }
        }
        else {
            if ("content" === uri.getScheme()) {
                return UriHelper.getDataColumn(uri, null, null);
            }
            else if ("file" === uri.getScheme()) {
                return uri.getPath();
            }
        }
        return undefined;
    };
    UriHelper.getDataColumn = function (uri, selection, selectionArgs) {
        var cursor = null;
        //var columns = [android.provider.MediaStore.MediaColumns.DATA];
        var columns = ["_display_name"];
        console.log("in getDataColumn - 1");

        var filePath;
        try {
            cursor = this.getContentResolver().query(uri, columns, selection, selectionArgs, null);
            //cursor = this.getContentResolver().query(uri, null, null, null, null);
            console.log("in getDataColumn - 2");

            if (cursor != null && cursor.moveToFirst()) {
               /* for(var i=0; i<cursor.getColumnCount();i++)
                {
                    console.log(`Column Name: ${cursor.getColumnName(i)}`);
                    try {
                        console.log(`Value: ${cursor.getString(i)}` );
                    } 
                    catch(e2) {
                    }
                    //map.put(cursor.getColumnName(i), cursor.getString(i));
                }*/
                console.log("in getDataColumn - 3");
                var column_index = cursor.getColumnIndexOrThrow(columns[0]);
                console.log("in getDataColumn - 4");
                filePath = cursor.getString(column_index);
                if (filePath) {
                    console.log("in getDataColumn - 5");
                    const dl = android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOWNLOADS)
                    filePath = `${dl}/${filePath}`;
                    console.log(`### and so we end up with: ${filePath}`)
                    return filePath;
                }
            }
        }
        catch (e) {
            console.log(e);
        }
        finally {
            if (cursor) {
                cursor.close();
            }
        }
        return undefined;
    };
    UriHelper.isExternalStorageDocument = function (uri) {
        return "com.android.externalstorage.documents" === uri.getAuthority();
    };
    UriHelper.isDownloadsDocument = function (uri) {
        return "com.android.providers.downloads.documents" === uri.getAuthority();
    };
    UriHelper.isMediaDocument = function (uri) {
        return "com.android.providers.media.documents" === uri.getAuthority();
    };
    UriHelper.getContentResolver = function () {
        return application.android.nativeApp.getContentResolver();
    };
    return UriHelper;
}());
var ImagePicker = (function () {
    function ImagePicker(options) {
        this._options = options;
    }
    Object.defineProperty(ImagePicker.prototype, "mode", {
        get: function () {
            return this._options && this._options.mode && this._options.mode.toLowerCase() === 'single' ? 'single' : 'multiple';
        },
        enumerable: true,
        configurable: true
    });
    ImagePicker.prototype.authorize = function () {
        if (android.os.Build.VERSION.SDK_INT >= 23) {
            return permissions.requestPermission([android.Manifest.permission.READ_EXTERNAL_STORAGE]);
        }
        else {
            return Promise.resolve();
        }
    };
    ImagePicker.prototype.present = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var RESULT_CODE_PICKER_IMAGES = 9192;
            var application = require("application");
            application.android.on(application.AndroidApplication.activityResultEvent, onResult);
            function onResult(args) {
                var requestCode = args.requestCode;
                var resultCode = args.resultCode;
                var data = args.intent;
                if (requestCode === RESULT_CODE_PICKER_IMAGES) {
                    if (resultCode === android.app.Activity.RESULT_OK) {
                        try {
                            var results = [];
                            var clip = data.getClipData();
                            if (clip) {
                                var count = clip.getItemCount();
                                for (var i = 0; i < count; i++) {
                                    var clipItem = clip.getItemAt(i);
                                    if (clipItem) {
                                        var uri = clipItem.getUri();
                                        if (uri) {
                                            var selectedAsset = new imageAssetModule.ImageAsset(UriHelper._calculateFileUri(uri));
                                            results.push(selectedAsset);
                                        }
                                    }
                                }
                            }
                            else {
                                var uri = data.getData();
                                var selectedAsset = new imageAssetModule.ImageAsset(UriHelper._calculateFileUri(uri));
                                results.push(selectedAsset);
                            }
                            application.android.off(application.AndroidApplication.activityResultEvent, onResult);
                            resolve(results);
                            return;
                        }
                        catch (e) {
                            application.android.off(application.AndroidApplication.activityResultEvent, onResult);
                            reject(e);
                            return;
                        }
                    }
                    else {
                        application.android.off(application.AndroidApplication.activityResultEvent, onResult);
                        reject(new Error("Image picker activity result code " + resultCode));
                        return;
                    }
                }
            }
            var Intent = android.content.Intent;
            var intent = new Intent();
            intent.setType("image/*");
            if (_this.mode === 'multiple') {
                intent.putExtra("android.intent.extra.ALLOW_MULTIPLE", true);
            }
            intent.putExtra(android.content.Intent.EXTRA_LOCAL_ONLY, true);
            intent.setAction("android.intent.action.OPEN_DOCUMENT");
            var chooser = Intent.createChooser(intent, "Select Picture");
            application.android.foregroundActivity.startActivityForResult(intent, RESULT_CODE_PICKER_IMAGES);
        });
    };
    return ImagePicker;
}());
exports.ImagePicker = ImagePicker;
function create(options) {
    return new ImagePicker(options);
}
exports.create = create;
//# sourceMappingURL=imagepicker.android.js.map