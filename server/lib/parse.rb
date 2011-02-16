require 'json'

module Math
  def self.max(a, b)
    a > b ? a : b
  end

  def self.min(a, b)
    a < b ? a : b
  end
end

def extract_times(s)
  if s =~ /\[Times: user=([0-9]+.[0-9]+) sys=([0-9]+.[0-9]+), real=([0-9]+.[0-9]+) secs\]/
    user = $1
    sys = $2
    real = $3
    return [user.to_f, sys.to_f, real.to_f]
  end
  return [0, 0, 0]
end

class GcEvent

  attr_reader :kind, :timestamp, :user, :sys, :real

  def initialize(kind, timestamp, times)
    @kind = kind
    @timestamp = timestamp
    @user = times[0]
    @sys = times[1]
    @real = times[2]
  end

end

class ParNewEvent < GcEvent

  attr_reader :young_before, :young_after, :young_size, :total_before, :total_after, :total_size

  def initialize(timestamp, times, young_before, young_after, young_size, total_before, total_after, total_size)
    super(:gc, timestamp, times)
    @young_before = young_before
    @young_after = young_after
    @young_size = young_size
    @total_before = total_before
    @total_after = total_after
    @total_size = total_size
  end

  def young_diff
    return young_before - young_after
  end

  def total_diff
    return total_before - total_after
  end

  def old_before
    return total_before - young_before
  end

  def old_after
    return total_after - young_after
  end

  def old_diff
    return old_after - old_before
  end

  def collected_garbage
    total_dif = total_before - total_after
    return total_dif
  end

  def promoted
    return Math.max(0, young_diff - total_diff)
  end

  def dump
    puts "#{timestamp.to_i};#{young_before};#{young_after};#{young_diff};#{total_before};#{total_after};#{total_diff};#{old_before};#{old_after};#{old_diff}"
  end

end

def parse_file(file_name)
  events = []
  IO.foreach(file_name) do |line|
    if line =~ /\A([0-9]+\.[0-9]+): (.*)\Z/
      timestamp = $1.to_f
      rest = $2
      if rest.start_with? "[GC "
        # [GC 29.542: [ParNew: 391936K->37702K(440896K), 0.0721040 secs] 391936K->37702K(8339648K), 0.0722940 secs] [Times: user=1.03 sys=0.07, real=0.07 secs]
        times = extract_times(rest)
        if rest =~ /\[ParNew: ([0-9]+)K->([0-9]+)K\(([0-9]+)K\), [0-9]+.[0-9]+ secs\] ([0-9]+)K->([0-9]+)K\(([0-9]+)K\)/
          young_before = $1.to_i
          young_after = $2.to_i
          young_size = $3.to_i
          total_before = $4.to_i
          total_after = $5.to_i
          total_size = $6.to_i
          events << ParNewEvent.new(timestamp, times, young_before, young_after, young_size, total_before, total_after, total_size)
        else
          #[GC [1 CMS-initial-mark: 3950740K(7898752K)] 3978078K(8339648K), 0.0790370 secs] [Times: user=0.04 sys=0.04, real=0.08 secs]
          times = extract_times(rest)
          events << GcEvent.new(:initmark, timestamp, times)
        end
      elsif rest.start_with? "[GC[YG occupancy:"
        # [GC[YG occupancy: 135948 K (440896 K)]3354.746: [Rescan (parallel) , 0.1260950 secs]3354.872: [weak refs processing, 0.0022170 secs]3354.874: [class unloading, 0.0251230 secs]3354.899: [scrub symbol & string tables, 0.0251100 secs] [1 CMS-remark: 4743835K(7898752K)] 4879784K(8339648K), 0.1927820 secs] [Times: user=2.89 sys=0.01, real=0.20 secs]
        times = extract_times(rest)
        events << GcEvent.new(:remark, timestamp, times)
      elsif rest.start_with? "[CMS-concurrent-mark-start]"
        # [CMS-concurrent-mark-start]
      elsif rest.start_with? "[CMS-concurrent-mark:"
        # [CMS-concurrent-mark: 2.296/2.296 secs] [Times: user=18.78 sys=0.18, real=2.30 secs]
        times = extract_times(rest)
        events << GcEvent.new(:mark, timestamp, times)
      elsif rest.start_with? "[CMS-concurrent-preclean-start]"
        # [CMS-concurrent-preclean-start]
      elsif rest.start_with? "[CMS-concurrent-preclean:"
        # [CMS-concurrent-preclean: 0.084/0.086 secs] [Times: user=0.57 sys=0.00, real=0.08 secs]
        times = extract_times(rest)
        events << GcEvent.new(:preclean, timestamp, times)
      elsif rest.start_with? "[CMS-concurrent-abortable-preclean-start]"
        # [CMS-concurrent-abortable-preclean-start]
      elsif rest.start_with? "[CMS-concurrent-abortable-preclean:"
        # [CMS-concurrent-abortable-preclean: 0.758/0.800 secs] [Times: user=5.77 sys=0.00, real=0.80 secs]
        times = extract_times(rest)
        events << GcEvent.new(:abortable_preclean, timestamp, times)
      elsif rest.start_with? "[CMS-concurrent-sweep-start]"
        # [CMS-concurrent-sweep-start]
      elsif rest.start_with? "[CMS-concurrent-sweep:"
        # [CMS-concurrent-sweep: 5.220/5.280 secs] [Times: user=15.99 sys=0.05, real=5.28 secs]
        times = extract_times(rest)
        events << GcEvent.new(:sweep, timestamp, times)
      elsif rest.start_with? "[CMS-concurrent-reset-start]"
        # [CMS-concurrent-reset-start]
      elsif rest.start_with? "[CMS-concurrent-reset:"
        # [CMS-concurrent-reset: 0.072/0.073 secs] [Times: user=0.10 sys=0.05, real=0.08 secs]
        times = extract_times(rest)
        events << GcEvent.new(:reset, timestamp, times)
      else
        puts rest
      end
    elsif line.start_with? "CMS: abort preclean due to time"
      # CMS: abort preclean due to time 3354.744: [CMS-concurrent-abortable-preclean: 3.395/5.040 secs] [Times: user=11.72 sys=0.03, real=5.04 secs]
      times = extract_times(rest)
      events << GcEvent.new(:abortable_preclean, timestamp, times)
    end
  end
  return events
end

def young_gen_timeseries(events, resolution)
  time = 0
  total = 0
  old = 0
  num_collections = 0
  collected_garbage = 0
  collected_old_garbage = 0
  promoted = 0
  cpu = 0
  real = 0

  list_total = []
  list_num_collections = []
  list_collected_garbage = []
  list_collected_old_garbage = []
  list_promoted = []
  list_cpu = []
  list_real = []

  for e in events
    if(e.kind == :gc)
      while e.timestamp > time
        list_total << total / 1024
        list_num_collections << num_collections
        list_collected_garbage << collected_garbage / 1024
        list_collected_old_garbage << collected_old_garbage / 1024
        list_promoted << promoted / 1024
        list_cpu << (cpu * 1000).to_i
        list_real << (real * 1000).to_i

        num_collections = 0
        collected_garbage = 0
        collected_old_garbage = 0
        promoted = 0
        cpu = 0
        real = 0
        time += resolution
      end
      num_collections += 1
      collected_old_garbage += old - e.old_before
      collected_garbage += e.collected_garbage
      promoted += e.promoted
      cpu += e.user + e.sys
      real += e.real
      old = e.old_after
      total = e.total_after
    end
  end

  return [
    list_total,
    list_num_collections,
    list_collected_garbage,
    list_collected_old_garbage,
    list_promoted,
    list_cpu,
    list_real
  ]

end

def old_gen_timeseries(events, resolution)
  time = 0
  
  num_collections = 0
  initmark_cpu = 0
  initmark_real = 0
  mark_cpu = 0
  mark_real = 0
  preclean_cpu = 0
  preclean_real = 0
  abortable_preclean_cpu = 0
  abortable_preclean_real = 0
  remark_cpu = 0
  remark_real = 0
  sweep_cpu = 0
  sweep_real = 0
  reset_cpu = 0
  reset_real = 0

  list_num_collections = []
  list_initmark_cpu = []
  list_initmark_real = []
  list_mark_cpu = []
  list_mark_real = []
  list_preclean_cpu = []
  list_preclean_real = []
  list_abortable_preclean_cpu = []
  list_abortable_preclean_real = []
  list_remark_cpu = []
  list_remark_real = []
  list_sweep_cpu = []
  list_sweep_real = []
  list_reset_cpu = []
  list_reset_real = []

  for e in events
    if e.kind != :gc
      while e.timestamp > time
        list_num_collections << num_collections
        list_initmark_cpu << initmark_cpu.round(2)
        list_initmark_real << initmark_real.round(2)
        list_mark_cpu << mark_cpu.round(2)
        list_mark_real << mark_real.round(2)
        list_preclean_cpu << preclean_cpu.round(2)
        list_preclean_real << preclean_real.round(2)
        list_abortable_preclean_cpu << abortable_preclean_cpu.round(2)
        list_abortable_preclean_real << abortable_preclean_real.round(2)
        list_remark_cpu << remark_cpu.round(2)
        list_remark_real << remark_real.round(2)
        list_sweep_cpu << sweep_cpu.round(2)
        list_sweep_real << sweep_real.round(2)
        list_reset_cpu << reset_cpu.round(2)
        list_reset_real << reset_real.round(2)

        num_collections = 0;
        initmark_cpu = 0
        initmark_real = 0
        mark_cpu = 0
        mark_real = 0
        preclean_cpu = 0
        preclean_real = 0
        abortable_preclean_cpu = 0
        abortable_preclean_real = 0
        remark_cpu = 0
        remark_real = 0
        sweep_cpu = 0
        sweep_real = 0
        reset_cpu = 0
        reset_real = 0
        time += resolution
      end
      if e.kind == :initmark
        initmark_cpu += e.user + e.sys
        initmark_real += e.real      
      elsif e.kind == :mark
        mark_cpu += e.user + e.sys
        mark_real += e.real
        num_collections += 1
      elsif e.kind == :preclean
        preclean_cpu += e.user + e.sys
        preclean_real += e.real
      elsif e.kind == :abortable_preclean
        abortable_preclean_cpu += e.user + e.sys
        abortable_preclean_real += e.real
      elsif e.kind == :remark
        remark_cpu += e.user + e.sys
        remark_real += e.real
      elsif e.kind == :sweep
        sweep_cpu += e.user + e.sys
        sweep_real += e.real
      elsif e.kind == :reset
        reset_cpu += e.user + e.sys
        reset_real += e.real
      end
    end
  end

  return [
    list_initmark_cpu,
    list_initmark_real,
    list_mark_cpu,
    list_mark_real,
    list_preclean_cpu,
    list_preclean_real,
    list_abortable_preclean_cpu,
    list_abortable_preclean_real,
    list_remark_cpu,
    list_remark_real,
    list_sweep_cpu,
    list_sweep_real,
    list_reset_cpu,
    list_reset_real,
    list_num_collections
  ]

end

def analyze_log_file(file_name)
  events = parse_file(file_name)
  young_gen = young_gen_timeseries(events, 10)
  old_gen = old_gen_timeseries(events, 10)
  
  #return JSON.pretty_generate([
  return JSON.dump([
    young_gen, 
    old_gen
  ])
end

def dump_csv(file_name)
  events = parse_file(file_name)
  puts "Time;Young Before;Young After;Young Diff;Total Before;Total After;Total Diff;Old Before;Old After;Old Diff"
  for e in events
    if e.kind == :gc
      e.dump()
    end
  end
end



# puts analyze_log_file("../../sample.log")
# dump_csv("../../sample.log")