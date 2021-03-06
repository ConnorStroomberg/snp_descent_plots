<template>
  <div>
    <div class="row">
      <div class="col">
        <h1>SNP descent plots</h1>
        <form>
          <div class="form-group">
            <label for="devFileInput">Definition file</label>
            <input class="form-control" id="devFileInput" type="file" @change="parseDefinitionFile">
          </div>
          <div class="form-group">
            <label for="snpFileInput">Data file</label>
            <input class="form-control" id="snpFileInput" type="file" @change="storeData">
          </div>
          <div class="form-group">
            <label for="selectChromosome">Chromosome</label>
            <select class="form-control" id="selectChromosome" v-model="selectedChromosome">
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
          <button type="button" class="btn btn-primary" id="processFiles" @click="onProcessData" :disabled="disableProcess">Process data</button>
          <button type="button" class="btn btn-primary" id="downloadPlot" @click="onDownloadButtonClick">
            <i class="fa fa-download" aria-hidden="true"></i>
          </button>
          <span id="statusUpdate"><small><i><span v-model="status">{{status}}</span></i></small><i
            class="fa fa-spinner fa-pulse fa-fw" v-if="isLoading"></i></span>
        </form>
      </div>
    </div>
    <div class="row">
      <div class="col">
        <div id="plot" class="plot-container">
        </div>
      </div>
    </div>
  </div>
</template>
<style>
  .plot-container {
    margin: 1rem 0;
  }

  #statusUpdate {
    color: grey;
  }
</style>
<script>
  import { mapState } from 'vuex'
  import { SET_PARSED_DEF_OBJ, SET_DATA_INDEX } from '../store/mutations'
  import * as d3 from 'd3'
  import { saveSvgAsPng } from 'save-svg-as-png'

  export default {
    name: 'snp-descent-plot',
    data: function () {
      return {
        disableProcess: true,
        isLoading: false,
        status: '',
        dataFile: undefined,
        hasDefFile: false,
        t0: undefined,
        t1: undefined,
        results: {},
        selectedChromosome: '1',
        plotSizes: {
          height: 300,
          width: 1000,
          bottomMargin: 30,
          titleOffset: 25
        }
      }
    },
    methods: {
      plot (data, plotId, counts, svg, yOffset) {
        this.status = `Plotting ${plotId}...`

        const timestamp = this.getCurrentDateTime()
        const dnaNumbers = this.$store.state.parsedDefObj[plotId]

        const height = this.plotSizes.height
        const width = this.plotSizes.width
        const titleOffset = this.plotSizes.titleOffset
        const plotWidth = width * 0.9
        const plotHeight = height / 2

        const x = d3.scaleLinear(x).range([plotWidth, 0])
        const y = d3.scaleLinear(y).range([plotHeight, 0])
        x.domain(d3.extent(data, d => d[0]))
        y.domain([0, d3.max(data, d => d[1])])

        const yAxisLeft = d3.axisLeft(y).scale(y)
          .tickFormat(function (d) {
            return d
          }).ticks(2)

        const yAxisRight = d3.axisRight(y).scale(y)
          .tickFormat(function (d) {
            return counts[d]
          })
          .ticks(2)
        svg.append('g')
          .attr('transform', `translate(${(parseInt(plotWidth) + 32)},${yOffset + 50})`)
          .attr('height', height)
          .call(yAxisRight)

        svg.append('g')
          .attr('transform', `translate(30,${yOffset + 50})`)
          .attr('height', height)
          .call(yAxisLeft)

        svg.selectAll('dot').data(data).enter().append('circle')
          .attr('r', 1)
          .attr('cx', d => x(d[0]))
          .attr('cy', d => y(d[1]) + ((Math.random() - 0.5) * 20))
          .attr('transform', `translate(32,${yOffset + 50})`)

        svg.append('text')
          .attr('x', width / 2)
          .attr('y', titleOffset + yOffset)
          .attr('text-anchor', 'middle')
          .text(`Chromosome ${this.selectedChromosome} : ${plotId} (${dnaNumbers[0]}-${dnaNumbers[1]})`)
        svg.append('text')
          .attr('x', plotWidth - 50)
          .attr('y', titleOffset + yOffset)
          .style('fill', 'grey')
          .style('font-size', '10px')
          .text(timestamp)
        svg.append('rect')
          .attr('x', 0)
          .attr('y', yOffset)
          .attr('height', height)
          .attr('width', width)
          .style('fill', 'none')
          .style('stroke', 'black')
          .style('stroke-width', 1)
      },
      setDisableProcess () {
        if (this.dataFile && this.hasDefFile) {
          this.disableProcess = false
        } else {
          this.disableProcess = true
        }
      },
      getCurrentDateTime () {
        var currentdate = new Date()
        var minutes = currentdate.getMinutes()
        if (minutes < 10) {
          minutes = '0' + minutes.toString()
        }
        var datetime = currentdate.getDate() + '/' +
          (currentdate.getMonth() + 1) + '/' +
          currentdate.getFullYear() + ' @ ' +
          currentdate.getHours() + ':' +
          minutes
        return datetime
      },
      onDownloadButtonClick () {
        const svgElements = document.querySelectorAll('div>.plot-container>svg')
        const timestamp = this.getCurrentDateTime().replace(/ /g, '_')
        svgElements.forEach(svgElement => {
          const name = `${timestamp}.png`
          saveSvgAsPng(svgElement, name, {backgroundColor: 'white'})
        })
      },
      clear () {
        this.results = {}
        d3.selectAll('svg').remove()
      },
      calculatePlotCombinations (defs) {
        const keys = Object.keys(defs)
        let results = {}
        for (let i = 0; i < keys.length - 1; i++) {
          // This is where you'll capture that last value
          for (let j = i + 1; j < keys.length; j++) {
            results[`${keys[i]}-${keys[j]}`] = [defs[keys[i]], defs[keys[j]]]
          }
        }
        return results
      },
      onProcessData () {
        this.isLoading = true
        this.status = 'Processing data'
        this.clear()
        this.t0 = performance.now()
        const maxLines = 1000000
        this.readSomeLines(this.dataFile, maxLines, this.forEachLine, this.onComplete)
      },
      storeData (event) {
        this.dataFile = event.target.files[0]
        this.setDisableProcess()
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
          const combinationLabels = Object.keys(this.$store.state.dataIndex)
          for (let combination of combinationLabels) {
            const index1 = this.$store.state.dataIndex[combination].gPos1
            const index2 = this.$store.state.dataIndex[combination].gPos2
            const id1 = columns[index1]
            const id2 = columns[index2]
            const alleleScore = this.compareAlleles(id1, id2)
            // The alleleScore is equal to the key in the counts object
            this.results[combination].counts[alleleScore] += 1
            this.results[combination].points.push([parseInt(columns[2]), alleleScore])
          }
        } else if (columns[0] === 'Name') {
          const parsedDefData = this.$store.state.parsedDefObj
          const dataIndex = this.buildDataIndex(parsedDefData, columns)
          this.$store.commit(SET_DATA_INDEX, dataIndex)
          for (let combination in dataIndex) {
            this.results[combination] = {'counts': {1: 0, 2: 0, 0: 0, '-1': 0}, 'points': []}
          }
        }
      },
      onComplete () {
        this.t1 = performance.now()
        const numberOfCombinations = Object.keys(this.$store.state.dataIndex).length
        const height = this.plotSizes.height
        const bottomMargin = this.plotSizes.bottomMargin
        const svg = d3.select('#plot')
          .append('svg')
          .attr('width', 1000)
          .attr('height', (height + bottomMargin) * numberOfCombinations)
          .attr('id', 'plots')
        let yOffset = 0
        for (let combination in this.$store.state.dataIndex) {
          this.plot(this.results[combination].points, combination, this.results[combination].counts, svg, yOffset)
          yOffset += height + bottomMargin
        }
        this.isLoading = false
        this.status = `Completed in ${Math.round((this.t1 - this.t0) / 1000)} seconds`
      },
      readDefinitionLines (lineData) {
        let defObj = {}
        const lines = lineData.split('\n')
        const columns = lines[0].replace(/\r/g, '').split('\t')
        columns.shift()
        const defs = lines[1].replace(/\r/g, '').split('\t')
        for (var i = 0; i < columns.length; i++) {
          defObj[columns[i]] = defs[i + 1]
        }
        return defObj
      },
      parseDefinitionFile (event) {
        const file = event.target.files[0]
        if (file) {
          this.hasDefFile = true
          const self = this
          const reader = new FileReader()
          reader.onload = function () {
            const defObj = self.readDefinitionLines(reader.result)
            self.$store.commit(SET_PARSED_DEF_OBJ, self.calculatePlotCombinations(defObj))
          }
          reader.readAsText(file)
        } else {
          this.hasDefFile = false
          this.setDisableProcess()
        }
      },
      buildDataIndex (parsedDefData, columnHeaders) {
        const combinations = Object.keys(parsedDefData)
        let dataIndex = {}
        for (let combination of combinations) {
          const gPos1 = columnHeaders.indexOf(parsedDefData[combination][0] + '.GType')
          const gPos2 = columnHeaders.indexOf(parsedDefData[combination][1] + '.GType')
          dataIndex[combination] = {gPos1, gPos2}
        }
        return dataIndex
      },
      readSomeLines (file, maxlines, forEachLine, onComplete) {
        const CHUNK_SIZE = 50000 // 50kb, arbitrarily chosen.
        // const decoder = new TextDecoder()
        let offset = 0
        let linecount = 0
        let results = ''
        const fileReader = new FileReader()
        fileReader.onload = function () {
          results = fileReader.result
          const lines = results.split('\n')
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
        fileReader.onerror = function () {
          onComplete(fileReader.error)
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
          fileReader.readAsText(slice)
        }
      }
    },
    computed: {
      ...mapState(['message'])
    }
  }
</script>
