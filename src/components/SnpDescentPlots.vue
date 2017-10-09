<template>
  <div>
    <div class="row">
      <div class="col">
        <h1>SNP descent plots</h1>
        <form>
          <div class="form-group">
            <label for="devFileInput">Definition file</label>
            <input class="form-control col-lg-6" id="devFileInput" type="file" @change="storeDefinition">
          </div>
          <div class="form-group">
            <label for="snpFileInput">Data file</label>
            <input class="form-control col-lg-6" id="snpFileInput" type="file" @change="storeData">
          </div>
          <div class="form-group">
            <label for="selectChromosome">Chromosome</label>
            <select class="form-control col-lg-1 col-3" id="selectChromosome" v-model="selectedChromosome">
              <option>1</option>
              <option>2</option>
              <option>3</option>
              <option>4</option>
              <option>5</option>
              <option>6</option>
              <option>7</option>
              <option>8</option>
              <option>9</option>
              <option>10</option>
              <option>11</option>
              <option>12</option>
              <option>13</option>
              <option>14</option>
              <option>15</option>
              <option>16</option>
              <option>17</option>
              <option>18</option>
              <option>19</option>
              <option>20</option>
              <option>21</option>
              <option>22</option>
              <option>X</option>
              <option>Y</option>
            </select>
          </div>
          <button type="button" class="btn btn-primary" id="processFiles" @click="onProcessData" :disabled="!dataFile">Process data</button>
          <a class="btn btn-primary" v-bind:class="{ disabled: !isDownloadReady }" id="download-btn" href="#" role="button" :disabled="!isDownloadReady">download</a>
        </form>
      </div>
    </div>
    <div class="row">
      <div class="col">
        <canvas id="plot" class="plot-container" width="1100" height="300"></canvas>
      </div>
    </div>
  </div>
</template>
<style>
  .plot-container {
    margin: 1rem 0;
    border: 1px solid #dddddd;
  }
</style>
<script>
  import {mapState} from 'vuex'

  export default {
    name: 'snp-descent-plot',
    data: function () {
      return {
        maxLines: 100000, // one million
        definitionFile: undefined,
        dataFile: undefined,
        t0: undefined,
        t1: undefined,
        results: [],
        selectedChromosome: '1',
        minY: 300000000,
        maxY: 0,
        isDownloadReady: false
      }
    },
    mounted: function () {
      /**
       * This is the function that will take care of image extracting and
       * setting proper filename for the download.
       * IMPORTANT: Call it from within a onclick event.
      */
      function downloadCanvas (link, canvasId, filename) {
        link.href = document.getElementById(canvasId).toDataURL()
        link.download = filename
      }

      /**
       * The event handler for the link's onclick event. We give THIS as a
       * parameter (=the link element), ID of the canvas and a filename.
      */
      document.getElementById('download-btn').addEventListener('click', function () {
        console.log('download')
        downloadCanvas(this, 'plot', 'test.png')
      }, false)
    },
    methods: {
      plot (data) {
        const canvas = document.getElementById('plot')
        const ctx = canvas.getContext('2d')
        const arc = 2 * Math.PI
        const width = (this.maxY - this.minY) - 20
        const xScale = 1000 / width  // with = 1000px
        const marginBottom = 50
        const marginLeft = 50
        const bandWidth = 20
        const bandDistance = 50
        const invertedYCorrection = 300 - marginBottom - bandWidth
        console.log('minPos: ' + this.minY + ' maxPos: ' + this.maxY + ' band-width: ' + bandWidth + ' x-scale: ' + xScale)
        this.drawYAxis(ctx, invertedYCorrection, marginLeft, marginBottom, bandWidth, bandDistance)
        for (let i = 0; i < data.length; i++) {
          const position = data[i][0]
          const score = data[i][1]
          const x = marginLeft + position * xScale
          const jitter = (Math.random() - 0.5) * bandWidth
          const y = (invertedYCorrection - ((score + 1) * bandDistance)) + jitter // plus one to normalize [-1, 2] to [0, 3]
          ctx.beginPath()
          ctx.arc(x, y, 2, 0, arc, false)
          // ctx.closePath()
          // ctx.fill()
          ctx.stroke()
        }
      },
      drawYAxis (ctx, invertedYCorrection, marginLeft, marginBottom, bandWidth, bandDistance) {
        const height = 3 * bandWidth + 3 * (bandDistance - bandWidth)
        const width = 1
        const distanceFromPlot = 16
        const x = marginLeft - distanceFromPlot
        const y = invertedYCorrection - height
        console.log('height: ' + height + ' y: ' + y + ' invertedYCorrection: ' + invertedYCorrection)
        ctx.fillRect(x, y, width, height)
      },
      setDownloadUrl () {
        const canvas = document.getElementById('plot')
        this.downloadUrl = canvas.toDataURL()
      },
      clear () {
        this.results = []
        this.minY = 300000000
        this.maxY = 0
        var canvas = document.getElementById('plot')
        // this resets the canvas
        canvas.width = canvas.width
      },
      onProcessData () {
        this.clear()
        this.t0 = performance.now()
        this.readSomeLines(this.dataFile, this.maxLines, this.forEachLine, this.onComplete)
      },
      storeData (event) {
        this.dataFile = event.target.files[0]
      },
      storeDefinition (event) {
        this.definitionFile = event.target.files[0]
      },
      compareAlleles (p1, p2) {
        if (p1 === p2 || (p1 === 'AB' && p2 === 'BA') || (p1 === 'BA' && p2 === 'AB')) {
          return 2
        }
        if ((p1 === 'AA' && p2 === 'BB') || (p1 === 'BB' && p2 === 'AA')) {
          return 0
        }
        if (p1 !== 'NC' && p2 !== 'NC') {
          const p1Allele1 = p1.charAt(0)
          const p1Allele2 = p1.charAt(1)
          const p2Allele1 = p1.charAt(0)
          const p2Allele2 = p1.charAt(1)
          if (p1Allele1 === p2Allele1 || p1Allele1 === p2Allele2 || p1Allele2 === p2Allele1 || p1Allele2 === p2Allele2) {
            return 1
          }
        } else {
          return -1
        }
      },
      isSelectedChromosome (columns) {
        return columns[1] === this.selectedChromosome
      },
      forEachLine (line) {
        const columns = line.split('\t')
        if (this.isSelectedChromosome(columns)) {
          const p1 = columns[3]
          const p2 = columns[6]
          const pos = parseInt(columns[2])
          if (pos > this.maxY) {
            this.maxY = pos
          }
          if (pos < this.minY) {
            this.minY = pos
          }
          this.results.push([pos, this.compareAlleles(p1, p2)])
        }
      },
      onComplete () {
        this.t1 = performance.now()
        console.log('parsed in: ' + Math.round((this.t1 - this.t0) / 1000) + ' seconds')
        this.plot(this.results)
        this.t2 = performance.now()
        console.log('drawn' + this.results.length + ' points in: ' + Math.round((this.t2 - this.t1) / 1000) + ' seconds')
        this.isDownloadReady = true
      },
      readSomeLines (file, maxlines, forEachLine, onComplete) {
        const CHUNK_SIZE = 50000 // 50kb, arbitrarily chosen.
        const decoder = new TextDecoder()
        let offset = 0
        let linecount = 0
        let results = ''
        const fr = new FileReader()
        fr.onload = function () {
          // Use stream:true in case we cut the file
          // in the middle of a multi-byte character
          results += decoder.decode(fr.result, {
            stream: true
          })
          let lines = results.split('\n')
          results = lines.pop() // In case the line did not end yet.
          linecount += lines.length

          if (linecount > maxlines) {
            // Read too many lines? Truncate the results.
            lines.length -= linecount - maxlines
            linecount = maxlines
          }

          for (let i = 0; i < lines.length; ++i) {
            forEachLine(lines[i] + '\n')
          }
          offset += CHUNK_SIZE
          seek()
        }
        fr.onerror = function () {
          onComplete(fr.error)
        }
        seek()

        function seek () {
          if (linecount === maxlines) {
            // We found enough lines.
            onComplete() // Done.
            return
          }
          if (offset !== 0 && offset >= file.size) {
            // We did not find all lines, but there are no more lines.
            forEachLine(results) // This is from lines.pop(), before.
            onComplete() // Done
            return
          }
          var slice = file.slice(offset, offset + CHUNK_SIZE)
          fr.readAsArrayBuffer(slice)
        }
      },
      readDefFile () {

      }
    },
    computed: {
      ...mapState(['message'])
    }
  }
</script>
