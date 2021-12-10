import projectPath from 'path'
import { fileURLToPath } from 'url'
import gulp from 'gulp'
import browsersync from 'browser-sync'
import fileinclude from 'gulp-file-include'
import del from 'del'
import scss from 'gulp-sass'
import autoprefixer from 'gulp-autoprefixer'
import mediaqueries from 'gulp-group-css-media-queries'
import cleancss from 'gulp-clean-css'
import rename from 'gulp-rename'
import minify from 'gulp-minify'
import imagemin from 'gulp-imagemin'
import webp from 'gulp-webp'
import webphtml from 'gulp-webp-html'
import webpcss from 'gulp-webpcss'
import ttf2woff from 'gulp-ttf2woff'
import ttf2woff2 from 'gulp-ttf2woff2'
import fonter from 'gulp-fonter'
import fs from 'fs'

const { src, dest } = gulp
const { dirname } = projectPath
const __dirname = dirname(fileURLToPath(import.meta.url))
const projectFolder = projectPath.basename(__dirname)
const sourceFolder = 'src'
const path = {
  build: {
    html: projectFolder + '/',
    css: projectFolder + '/css/',
    js: projectFolder + '/js/',
    img: projectFolder + '/img/',
    fonts: projectFolder + '/fonts/'
  },
  src: {
    html: sourceFolder + '/[^_]*.html',
    css: sourceFolder + '/scss/style.scss',
    js: sourceFolder + '/js/script.js',
    img: sourceFolder + '/img/**/*.+(png|jpg|gif|ico|svg|webp)',
    fonts: sourceFolder + '/fonts/*.+(ttf|svg)'
  },
  watch: {
    html: sourceFolder + '/**/*.html',
    css: sourceFolder + '/scss/**/*.scss',
    js: sourceFolder + '/js/**/*.js',
    img: sourceFolder + '/img/**/*.+(png|jpg|gif|ico|svg|webp)'
  },
  clean: './' + projectFolder + '/'
}

function browserSync () {
  browsersync.init({
    server: {
      baseDir: './' + projectFolder + '/'
    },
    port: 3000,
    notify: false
  })
}

export function html () {
  return src(path.src.html)
    .pipe(fileinclude())
    .pipe(webphtml())
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream())
}

export function css () {
  return src(path.src.css)
    .pipe(
      scss({
        outputStyle: 'expanded'
      })
    )
    .pipe(
      autoprefixer({
        grid: true,
        overrideBrowserslist: ['last 5 version'],
        cascade: true
      })
    )
    .pipe(mediaqueries())
    .pipe(
      webpcss({
        webpClass: '.webp',
        noWebpClass: '.no-webp'
      })
    )
    .pipe(dest(path.build.css))
    .pipe(cleancss())
    .pipe(
      rename({
        extname: '.min.css'
      })
    )
    .pipe(dest(path.build.css))
    .pipe(browsersync.stream())
}

export function js () {
  return src(path.src.js)
    .pipe(fileinclude())
    .pipe(dest(path.build.js))
    .pipe(minify({
      ext: {
        min: '.min.js'
      }
    }))
    .pipe(dest(path.build.js))
    .pipe(browsersync.stream())
}

export function img () {
  return src(path.src.img)
    .pipe(
      webp({
        quality: 70
      })
    )
    .pipe(dest(path.build.img))
    .pipe(src(path.src.img))
    .pipe(
      imagemin({
        interlaced: true,
        progressive: true,
        optimizationLevel: 4,
        svgoPlugins: [{ removeViewBox: false }]
      })
    )
    .pipe(dest(path.build.img))
    .pipe(browsersync.stream())
}

export function fonts () {
  src(path.src.fonts)
    .pipe(ttf2woff())
    .pipe(dest(path.build.fonts))
  return src(path.src.fonts)
    .pipe(ttf2woff2())
    .pipe(dest(path.build.fonts))
}

export function otf2ttf () {
  return src([sourceFolder + '/fonts/*.otf'])
    .pipe(fonter({
      formats: ['ttf']
    }))
    .pipe(dest(sourceFolder + '/fonts/'))
}

export function fontsStyle () {
  const fileContent = fs.readFileSync(sourceFolder + '/scss/fonts.scss')
  if (String(fileContent) === '') {
    fs.writeFile(sourceFolder + '/scss/fonts.scss', '', cb)
    return fs.readdir(path.build.fonts,
      function (err, items) {
        if (items) {
          let currFont
          for (let i = 0; i < items.length; i++) {
            let fontname = items[i].split('.')
            fontname = fontname[0]
            if (currFont !== fontname) {
              fs.appendFile(sourceFolder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb)
            }
            currFont = fontname
          }
        } else {
          console.log(err)
        }
      }
    )
  }
}
function cb () { }

function watchFiles () {
  gulp.watch([path.watch.html], html)
  gulp.watch([path.watch.css], css)
  gulp.watch([path.watch.js], js)
  gulp.watch([path.watch.img], img)
}

function clean () {
  return del(path.clean)
}

export const build = gulp.series(clean, gulp.parallel(html, css, js, img, fonts), fontsStyle)
export default gulp.parallel(build, watchFiles, browserSync)
