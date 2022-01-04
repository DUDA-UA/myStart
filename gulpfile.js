let project_folder = 'dist';
let source_folder = '#src';

let fs = require('fs')

let path = {
    build:{
        html: project_folder + '/',
        css: project_folder + '/css/',
        js: project_folder + '/js/',
        fonts: project_folder + '/fonts/',
        img: project_folder + '/img/'
    },
    src:{
        html: [source_folder + '/*.html', "!" + source_folder + '/_*.html'],
        css: source_folder + '/scss/style.scss',
        js: source_folder + '/js/script.js',
        fonts: source_folder + '/fonts/*.ttf',
        img: source_folder + '/img/**/*.{jpg,jpeg,png,webp,svg,gif,ico}'
    },
    watch:{
        html: source_folder + '/**/*.html',
        css: source_folder + '/scss/**/*.scss',
        js: source_folder + '/js/**/*.js',
        img: source_folder + '/img/**/*.{jpg,jpeg,png,webp,svg,gif,ico}'
    },
    clean: './' + project_folder + '/'
}

// for all file
let {src,dest,parallel,series} = require('gulp'),
gulp = require('gulp');
// for html
const fileinclude = require('gulp-file-include');
browsersync = require('browser-sync').create();
del = require('del');
// for css
sass = require('gulp-sass');
autoprefixer = require('gulp-autoprefixer');
mediacss = require('gulp-group-css-media-queries');
cleancss = require('gulp-clean-css');
renamefile = require('gulp-rename');
// for js
uglify = require('gulp-uglify-es').default;
babel = require('gulp-babel');
// for img
imageminfile = require('gulp-imagemin');
webp = require('gulp-webp');
webphtml = require('gulp-webp-html');
webpcss = require('gulp-webp-css');
svgsprite = require('gulp-svg-sprite');
// for fonts
woff = require('gulp-ttf2woff');
woff2 = require('gulp-ttf2woff2');
fonter = require('gulp-fonter');

function browserSync() {
    browsersync.init({
        server:{
            baseDir: './' + project_folder + '/'
        },
        port: 3000,
        notify: false
    })
}

function html() {
    return src(path.src.html)
        .pipe(fileinclude())
        .pipe(webphtml())
        .pipe(dest(path.build.html))
        .pipe(browsersync.stream())
}

function css() {
    return src(path.src.css)
        .pipe(sass({
            outputStyle:"expanded"
        }))
        .pipe(mediacss())
        .pipe(autoprefixer({
            overrideBrowserslist:['last 5 version'],
            cascade: true
        }))
        .pipe(webpcss())
        .pipe(dest(path.build.css))
        .pipe(cleancss())
        .pipe(renamefile({
            extname:'.min.css'
        }))
        .pipe(dest(path.build.css))
        .pipe(browsersync.stream())
}

function js() {
    return src(path.src.js)
        .pipe(fileinclude())
        .pipe(babel({
            presets: ["@babel/preset-env"]
        }))
        .pipe(dest(path.build.js))
        .pipe(uglify())
        .pipe(renamefile({
            extname:'.min.js'
        }))
        .pipe(dest(path.build.js))
        .pipe(browsersync.stream())
}

function img() {
    return src(path.src.img)
        .pipe(webp({
            quality: 70
        }))
        .pipe(dest(path.build.img))
        .pipe(src(path.src.img))
        .pipe(imageminfile({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            interlaced: true,
            optimizationLevel: 3
        }))
        .pipe(dest(path.build.img))
        .pipe(browsersync.stream())
}

gulp.task('otf2ttf', function(){
    return src([source_folder + '/fonts/*.otf'])
        .pipe(
            fonter({
                formats: ['ttf']
            })
        )
        .pipe(dest(source_folder + '/fonts/'))
}
)

gulp.task('svgSprite', function(){
    // получение исходников(иконок)
    return gulp.src([source_folder + '/iconsprite/*.svg'])
        .pipe(
            svgsprite({
                mode:{
                    stack:{
                        // путь вывода в выгрузку спрайта
                        sprite: "../icons/icons.svg", //sprite file name
                        example:true  //команда говорит, нужен ли отображаться пример в html
                    }
                },
            })
        )
        .pipe(dest(path.build.img))
})

function fonts() {
    src(path.src.fonts)
        .pipe(woff())
        .pipe(dest(path.build.fonts))
    return src(path.src.fonts)
        .pipe(woff2())
        .pipe(dest(path.build.fonts))    
}

function cleanFile() {
    return del(path.clean)
}

function fontsStyle(cb) {
    let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss');
    if (file_content == '') {
    fs.writeFile(source_folder + '/scss/fonts.scss', '', cb);
    return fs.readdir(path.build.fonts, function (err, items) {
    if (items) {
    let c_fontname;
    for (var i = 0; i < items.length; i++) {
    let fontname = items[i].split('.');
    fontname = fontname[0];
    if (c_fontname != fontname) {
    fs.appendFile(source_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
    }
    c_fontname = fontname;
    }
    }
    })
    }
    cb()
}

function watchFiles() {
    gulp.watch([path.watch.html],html);
    gulp.watch([path.watch.css],css);
    gulp.watch([path.watch.js],js);
    gulp.watch([path.watch.img],img);
}

let build = series(cleanFile,parallel(html,css,js,img,fonts),fontsStyle);
let watch = parallel(build,watchFiles,browserSync);

exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.img = img;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;